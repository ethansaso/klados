import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../../../db/client";
import {
  categoricalCharacterMeta,
  categoricalTraitValue,
  character,
} from "../../../db/schema/schema";
import {
  deleteSynonymSetIfEmpty,
  insertSynonymSet,
} from "../../../src/lib/domain/traits/repo";
import { Transaction } from "../../../src/lib/utils/transactionType";
import { askYesNo } from "../../utils/askYesNo";
import { ansiBlock, buildColorSeedPlan, ColorDef } from "../colors/util";

const COLOR_CHARACTER_LABEL = "Color";

type ExistingTrait = {
  id: number;
  label: string;
  hexCode: string | null;
  synonymSetId: number;
};

type SyncStats = {
  inserted: number;
  updated: number;
  setsCreated: number;
  setsDeleted: number;
  unmanaged: string[];
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

  // Ensure categorical metadata exists
  await tx
    .insert(categoricalCharacterMeta)
    .values({
      characterId: charRow.id,
      isMultiSelect: true,
    })
    .onConflictDoNothing();

  return charRow;
}

/**
 * Index a character's trait values by lowercased label.
 * Throws on labels that differ only in case, which the seed cannot resolve.
 */
function indexByLabel(rows: ExistingTrait[]): Map<string, ExistingTrait> {
  const byLabel = new Map<string, ExistingTrait>();
  const collisions: string[] = [];

  for (const row of rows) {
    const key = row.label.toLowerCase();
    const seen = byLabel.get(key);
    if (seen) {
      collisions.push(`"${seen.label}" and "${row.label}"`);
    } else {
      byLabel.set(key, row);
    }
  }

  if (collisions.length > 0) {
    throw new Error(
      `Existing colors differ only by case, so seeding cannot tell them apart:\n${collisions
        .map((c) => `  - ${c}`)
        .join("\n")}\nMerge or rename them, then re-run.`,
    );
  }

  return byLabel;
}

/**
 * Pick which set a color's labels should land in: whichever set the most of
 * them already share, lowest id winning ties. Keeps churn off the common path.
 */
function pickTargetSet(rows: ExistingTrait[]): number {
  const counts = new Map<number, number>();
  for (const row of rows) {
    counts.set(row.synonymSetId, (counts.get(row.synonymSetId) ?? 0) + 1);
  }

  let best = rows[0].synonymSetId;
  for (const [setId, n] of counts) {
    const bestN = counts.get(best)!;
    if (n > bestN || (n === bestN && setId < best)) best = setId;
  }

  return best;
}

/**
 * Reconcile the character's trait values against the seed plan, one synonym set
 * per color. Trait values outside the plan are left alone and reported back.
 */
async function syncColorSetsTx(
  tx: Transaction,
  characterId: number,
  plan: ColorDef[],
): Promise<SyncStats> {
  const existing: ExistingTrait[] = await tx
    .select({
      id: categoricalTraitValue.id,
      label: categoricalTraitValue.label,
      hexCode: categoricalTraitValue.hexCode,
      synonymSetId: categoricalTraitValue.synonymSetId,
    })
    .from(categoricalTraitValue)
    .where(eq(categoricalTraitValue.characterId, characterId));

  const byLabel = indexByLabel(existing);
  const stats: SyncStats = {
    inserted: 0,
    updated: 0,
    setsCreated: 0,
    setsDeleted: 0,
    unmanaged: [],
  };

  const planned = new Set<string>();
  const targetSets = new Set<number>();
  const vacatedSets = new Set<number>();

  for (const color of plan) {
    const labels = [color.label, ...color.synonyms];
    for (const label of labels) planned.add(label.toLowerCase());

    const rows = labels
      .map((label) => byLabel.get(label.toLowerCase()))
      .filter((row): row is ExistingTrait => row !== undefined);

    let setId: number;
    if (rows.length > 0) {
      setId = pickTargetSet(rows);
    } else {
      setId = (await insertSynonymSet(tx, characterId)).id;
      stats.setsCreated += 1;
    }
    targetSets.add(setId);

    for (const label of labels) {
      const row = byLabel.get(label.toLowerCase());

      if (!row) {
        await tx.insert(categoricalTraitValue).values({
          characterId,
          synonymSetId: setId,
          label,
          hexCode: color.hexCode,
        });
        stats.inserted += 1;
        continue;
      }

      const settled =
        row.label === label &&
        row.synonymSetId === setId &&
        row.hexCode === color.hexCode;
      if (settled) continue;

      if (row.synonymSetId !== setId) vacatedSets.add(row.synonymSetId);

      // Label is rewritten too, so the plan owns capitalisation
      await tx
        .update(categoricalTraitValue)
        .set({ label, synonymSetId: setId, hexCode: color.hexCode })
        .where(eq(categoricalTraitValue.id, row.id));
      stats.updated += 1;
    }
  }

  for (const setId of vacatedSets) {
    if (targetSets.has(setId)) continue;
    if (await deleteSynonymSetIfEmpty(tx, setId)) stats.setsDeleted += 1;
  }

  stats.unmanaged = existing
    .filter((row) => !planned.has(row.label.toLowerCase()))
    .map((row) => row.label)
    .sort();

  return stats;
}

function printPlan(plan: ColorDef[]) {
  console.log("\n=== Preview: Standard Color Palette ===\n");
  console.log(
    `${plan.length} colors, ${plan.reduce((n, c) => n + 1 + c.synonyms.length, 0)} labels\n`,
  );

  for (const color of plan) {
    const swatch = color.hexCode
      ? `${ansiBlock(color.hexCode)}  ${color.hexCode}`
      : "[no swatch / no hex]";
    console.log(`${color.label.padEnd(32)} ${swatch}`);

    for (const synonym of color.synonyms) {
      console.log(`    - ${synonym}`);
    }
  }
}

export async function run() {
  const plan = buildColorSeedPlan();

  printPlan(plan);

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
    return syncColorSetsTx(tx, colorCharacter.id, plan);
  });

  console.log(
    `Done. ${stats.inserted} label(s) inserted, ${stats.updated} updated, ` +
      `${stats.setsCreated} synonym set(s) created, ${stats.setsDeleted} removed.`,
  );

  if (stats.unmanaged.length > 0) {
    console.log(
      `\n${stats.unmanaged.length} existing color(s) are not in the palette and were left untouched:`,
    );
    for (const label of stats.unmanaged) console.log(`  - ${label}`);
  }

  console.log();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
