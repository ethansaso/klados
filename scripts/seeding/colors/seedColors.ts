import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../../../db/client";
import {
  categoricalCharacterMeta,
  categoricalTraitValue,
  character,
  traitSynonymSet,
} from "../../../db/schema/schema";
import {
  buildColorPalette,
  COLOR_CHARACTER_LABEL,
  type PaletteColor,
} from "../../../src/lib/domain/traits/colorPalette";
import { insertSynonymSet } from "../../../src/lib/domain/traits/repo";
import type { Transaction } from "../../../src/lib/utils/types/transactionType";
import { askYesNo } from "../../utils/askYesNo";
import { ansiBlock } from "./ansiBlock";

type ExistingTrait = {
  id: number;
  label: string;
  synonymSetId: number;
};

type SyncStats = {
  inserted: number;
  updated: number;
  recolored: number;
  setsCreated: number;
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
 * Index the rows holding canonical labels by lowercased label. Other labels
 * are curators' and never looked at. Throws when canonical labels differ only
 * in case, or share a set: either way seeding can't tell which is right.
 */
function indexCanonicalRows(
  rows: ExistingTrait[],
  palette: PaletteColor[],
): Map<string, ExistingTrait> {
  const canonical = new Set(palette.map((color) => color.label));
  const byLabel = new Map<string, ExistingTrait>();
  const bySet = new Map<number, string[]>();
  const problems: string[] = [];

  for (const row of rows) {
    const key = row.label.toLowerCase();
    if (!canonical.has(key)) continue;

    const seen = byLabel.get(key);
    if (seen) {
      problems.push(`"${seen.label}" and "${row.label}" differ only by case`);
      continue;
    }
    byLabel.set(key, row);

    const sharing = bySet.get(row.synonymSetId) ?? [];
    sharing.push(row.label);
    bySet.set(row.synonymSetId, sharing);
  }

  for (const labels of bySet.values()) {
    if (labels.length > 1) {
      problems.push(`${labels.map((l) => `"${l}"`).join(", ")} share a set`);
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Canonical colors are in a state seeding can't resolve:\n${problems
        .map((p) => `  - ${p}`)
        .join("\n")}\nFix them by hand, then re-run.`,
    );
  }

  return byLabel;
}

/**
 * Reconcile the character's sets against the palette: one set per canonical
 * label, carrying its color's hex. Each set is found by its canonical label;
 * every other label in it belongs to curators and is never touched.
 */
async function syncColorSetsTx(
  tx: Transaction,
  characterId: number,
  palette: PaletteColor[],
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
    updated: 0,
    recolored: 0,
    setsCreated: 0,
    setsWithoutCanonical: [],
  };

  const canonicalSets = new Set<number>();

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

    canonicalSets.add(setId);

    if (hexBySet.get(setId) !== color.hexCode) {
      await tx
        .update(traitSynonymSet)
        .set({ hexCode: color.hexCode })
        .where(eq(traitSynonymSet.id, setId));
      stats.recolored += 1;
    }
  }

  const withoutCanonical = new Map<number, string[]>();
  for (const row of existing) {
    if (canonicalSets.has(row.synonymSetId)) continue;
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

export async function run() {
  const palette = buildColorPalette();

  printPalette(palette);

  console.log();
  const shouldProceed = await askYesNo(
    "Proceed with upserting these colors into the database? (y/N) ",
  );

  if (!shouldProceed) {
    console.log("\nAborted. No database changes were made.\n");
    process.exit(0);
  }

  console.log("\nUpserting colors into DB...\n");

  const stats = await db.transaction(async (tx) => {
    const colorCharacter = await getOrCreateColorCharacterTx(tx);
    return syncColorSetsTx(tx, colorCharacter.id, palette);
  });

  console.log(
    `Done. ${stats.inserted} canonical label(s) inserted, ${stats.updated} updated, ` +
      `${stats.recolored} set(s) recolored, ${stats.setsCreated} set(s) created.`,
  );

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
