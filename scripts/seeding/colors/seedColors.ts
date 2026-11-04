import "dotenv/config";
import { eq, TransactionRollbackError } from "drizzle-orm";
import { db } from "../../../db/client";
import {
  categoricalCharacterMeta,
  categoricalTraitValue,
  character,
  traitSynonymSet,
} from "../../../db/schema/schema";
import {
  buildColorAliases,
  type ColorAlias,
} from "../../../src/lib/domain/traits/colorAliases";
import {
  buildColorPalette,
  COLOR_CHARACTER_LABEL,
  type PaletteColor,
} from "../../../src/lib/domain/traits/colorPalette";
import {
  deleteSynonymSetIfEmpty,
  insertSynonymSet,
  moveTraitToSet,
} from "../../../src/lib/domain/traits/repo";
import type { Transaction } from "../../../src/lib/utils/types/transactionType";
import { askYesNo } from "../../utils/askYesNo";
import { ansiBlock } from "./ansiBlock";

type ExistingTrait = {
  id: number;
  label: string;
  synonymSetId: number;
};

type AliasMove = {
  label: string;
  /** Canonical label of the set it leaves, if that set has one. */
  from: string | null;
  to: string;
};

type SyncStats = {
  inserted: number;
  aliasesInserted: number;
  /** Canonical labels and aliases whose capitalisation was corrected. */
  updated: number;
  recolored: number;
  setsCreated: number;
  aliasMoves: AliasMove[];
  /** Sets left empty by an alias move, then deleted. */
  setsDeleted: number;
  /** Labels of each locked set with no canonical label, e.g. hand-made sets. */
  setsWithoutCanonical: string[][];
};

/**
 * Fetch or create the "Color" character inside a transaction.
 */
async function getOrCreateColorCharacterTx(tx: Transaction) {
  const existing = await tx
    .select()
    .from(character)
    .where(eq(character.label, COLOR_CHARACTER_LABEL))
    .limit(1);

  let charRow;

  if (existing.length > 0) {
    charRow = existing[0];
  } else {
    const [inserted] = await tx
      .insert(character)
      .values({
        label: COLOR_CHARACTER_LABEL,
        showInProse: false,
      })
      .returning();

    charRow = inserted;
  }

  // Ensure categorical metadata exists, and that its sets are locked
  await tx
    .insert(categoricalCharacterMeta)
    .values({
      characterId: charRow.id,
      isMultiSelect: true,
      hasLockedSets: true,
    })
    .onConflictDoUpdate({
      target: categoricalCharacterMeta.characterId,
      set: { hasLockedSets: true },
    });

  return charRow;
}

/**
 * Index the rows holding canonical labels by lowercased label (labels are
 * unique ignoring case). Other labels are curators' and never looked at.
 * Throws when canonical labels share a set, since seeding can't tell which
 * one the set's synonyms belong to.
 */
function indexCanonicalRows(
  rows: ExistingTrait[],
  palette: PaletteColor[],
): Map<string, ExistingTrait> {
  const canonical = new Set(palette.map((color) => color.label));
  const byLabel = new Map<string, ExistingTrait>();
  const bySet = new Map<number, string[]>();

  for (const row of rows) {
    const key = row.label.toLowerCase();
    if (!canonical.has(key)) continue;

    byLabel.set(key, row);

    const sharing = bySet.get(row.synonymSetId) ?? [];
    sharing.push(row.label);
    bySet.set(row.synonymSetId, sharing);
  }

  const shared = [...bySet.values()].filter((labels) => labels.length > 1);
  if (shared.length > 0) {
    throw new Error(
      `Canonical colors share a set, so seeding can't tell them apart:\n${shared
        .map((labels) => `  - ${labels.map((l) => `"${l}"`).join(", ")}`)
        .join("\n")}\nFix them by hand, then re-run.`,
    );
  }

  return byLabel;
}

/**
 * Reconcile the character's sets against the palette: one set per canonical
 * label, carrying its color's hex, plus each alias in its canonical's set.
 * Each set is found by its canonical label; every other label in it belongs
 * to curators and is never touched.
 */
async function syncColorSetsTx(
  tx: Transaction,
  characterId: number,
  palette: PaletteColor[],
  aliases: ColorAlias[],
): Promise<SyncStats> {
  const existing: ExistingTrait[] = await tx
    .select({
      id: categoricalTraitValue.id,
      label: categoricalTraitValue.label,
      synonymSetId: categoricalTraitValue.synonymSetId,
    })
    .from(categoricalTraitValue)
    .where(eq(categoricalTraitValue.characterId, characterId));

  const sets = await tx
    .select({ id: traitSynonymSet.id, hexCode: traitSynonymSet.hexCode })
    .from(traitSynonymSet)
    .where(eq(traitSynonymSet.characterId, characterId));
  const hexBySet = new Map(sets.map((set) => [set.id, set.hexCode]));

  const canonicalRows = indexCanonicalRows(existing, palette);
  const stats: SyncStats = {
    inserted: 0,
    aliasesInserted: 0,
    updated: 0,
    recolored: 0,
    setsCreated: 0,
    aliasMoves: [],
    setsDeleted: 0,
    setsWithoutCanonical: [],
  };

  const setByCanonical = new Map<string, number>();
  const canonicalBySet = new Map<number, string>();

  for (const color of palette) {
    const row = canonicalRows.get(color.label);
    let setId: number;

    if (!row) {
      setId = (await insertSynonymSet(tx, characterId)).id;
      hexBySet.set(setId, null);
      stats.setsCreated += 1;

      await tx
        .insert(categoricalTraitValue)
        .values({ characterId, synonymSetId: setId, label: color.label });
      stats.inserted += 1;
    } else {
      setId = row.synonymSetId;

      // The palette owns capitalisation
      if (row.label !== color.label) {
        await tx
          .update(categoricalTraitValue)
          .set({ label: color.label })
          .where(eq(categoricalTraitValue.id, row.id));
        stats.updated += 1;
      }
    }

    setByCanonical.set(color.label, setId);
    canonicalBySet.set(setId, color.label);

    if (hexBySet.get(setId) !== color.hexCode) {
      await tx
        .update(traitSynonymSet)
        .set({ hexCode: color.hexCode })
        .where(eq(traitSynonymSet.id, setId));
      stats.recolored += 1;
    }
  }

  const rowsByLabel = new Map(
    existing.map((row) => [row.label.toLowerCase(), row]),
  );
  const vacated = new Set<number>();

  for (const alias of aliases) {
    const setId = setByCanonical.get(alias.canonical)!;
    const row = rowsByLabel.get(alias.label);

    if (!row) {
      await tx
        .insert(categoricalTraitValue)
        .values({ characterId, synonymSetId: setId, label: alias.label });
      stats.aliasesInserted += 1;
      continue;
    }

    if (row.synonymSetId !== setId) {
      // States follow through their cascading foreign key
      await moveTraitToSet(tx, row.id, setId);
      stats.aliasMoves.push({
        label: alias.label,
        from: canonicalBySet.get(row.synonymSetId) ?? null,
        to: alias.canonical,
      });
      vacated.add(row.synonymSetId);
      row.synonymSetId = setId;
    }

    if (row.label !== alias.label) {
      await tx
        .update(categoricalTraitValue)
        .set({ label: alias.label })
        .where(eq(categoricalTraitValue.id, row.id));
      stats.updated += 1;
    }
  }

  for (const setId of vacated) {
    if (await deleteSynonymSetIfEmpty(tx, setId)) stats.setsDeleted += 1;
  }

  const withoutCanonical = new Map<number, string[]>();
  for (const row of existing) {
    if (canonicalBySet.has(row.synonymSetId)) continue;
    const labels = withoutCanonical.get(row.synonymSetId) ?? [];
    labels.push(row.label);
    withoutCanonical.set(row.synonymSetId, labels);
  }
  stats.setsWithoutCanonical = [...withoutCanonical.values()]
    .map((labels) => labels.sort())
    .sort((a, b) => a[0]!.localeCompare(b[0]!));

  return stats;
}

function printPalette(palette: PaletteColor[]) {
  console.log("\n=== Preview: Standard Color Palette ===\n");
  console.log(`${palette.length} canonical colors\n`);

  for (const color of palette) {
    const swatch = color.hexCode
      ? `${ansiBlock(color.hexCode)}  ${color.hexCode}`
      : "[no swatch / no hex]";
    console.log(`${color.label.padEnd(32)} ${swatch}`);
  }
}

function hasChanges(stats: SyncStats): boolean {
  return (
    stats.inserted +
      stats.aliasesInserted +
      stats.updated +
      stats.recolored +
      stats.setsCreated +
      stats.aliasMoves.length >
    0
  );
}

function printChanges(stats: SyncStats) {
  console.log(
    `\n${stats.inserted} canonical label(s) to insert, ${stats.aliasesInserted} alias(es) to insert, ` +
      `${stats.updated} label(s) to recapitalize, ${stats.recolored} set(s) to recolor, ` +
      `${stats.setsCreated} set(s) to create.`,
  );

  if (stats.aliasMoves.length > 0) {
    console.log(
      `\n${stats.aliasMoves.length} alias(es) to move, with their states:`,
    );
    for (const { label, from, to } of stats.aliasMoves) {
      console.log(
        `  - "${label}": ${from ?? "set with no canonical label"} -> ${to}`,
      );
    }
    if (stats.setsDeleted > 0) {
      console.log(`  ${stats.setsDeleted} emptied set(s) will be deleted.`);
    }
  }
}

export async function run() {
  const palette = buildColorPalette();
  const aliases = buildColorAliases();

  printPalette(palette);

  // Plans inside the transaction so the confirmation shows exactly what commits
  let stats: SyncStats;
  try {
    stats = await db.transaction(async (tx) => {
      const colorCharacter = await getOrCreateColorCharacterTx(tx);
      const planned = await syncColorSetsTx(
        tx,
        colorCharacter.id,
        palette,
        aliases,
      );

      if (!hasChanges(planned)) return planned;

      printChanges(planned);
      console.log();
      if (!(await askYesNo("Apply these changes? (y/N) "))) tx.rollback();

      return planned;
    });
  } catch (err) {
    if (!(err instanceof TransactionRollbackError)) throw err;
    console.log("\nAborted. No database changes were made.\n");
    process.exit(0);
  }

  console.log(hasChanges(stats) ? "\nDone." : "\nAlready up to date.");

  if (stats.setsWithoutCanonical.length > 0) {
    console.log(
      `\n${stats.setsWithoutCanonical.length} set(s) have no canonical label; move their labels into a palette set:`,
    );
    for (const labels of stats.setsWithoutCanonical) {
      console.log(`  - ${labels.join(", ")}`);
    }
  }

  console.log();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
