import "dotenv/config";
import { and, eq } from "drizzle-orm";
import readline from "node:readline";
import { db } from "../../../src/db/client";
import {
  categoricalTraitSet,
  categoricalTraitValue,
} from "../../../src/db/schema/schema";
import { Transaction } from "../../../src/lib/utils/transactionType";
import {
  ansiBlock,
  generateCanonicalColorDefs,
  getNormalizedColorAliases,
} from "../colors/util";

type ColorDef = {
  key: string; // machine key (snake_case)
  label: string; // human label
  hexCode: string | null;
};

const COLOR_TRAIT_SET_KEY = "colors";

/** Confirms via CLI after colors are printed. */
function askYesNo(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === "y" || normalized === "yes");
    });
  });
}

/**
 * Fetch or create the "colors" trait set inside a transaction.
 */
async function getOrCreateColorTraitSetTx(tx: Transaction) {
  const existing = await tx
    .select()
    .from(categoricalTraitSet)
    .where(eq(categoricalTraitSet.key, COLOR_TRAIT_SET_KEY))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const [inserted] = await tx
    .insert(categoricalTraitSet)
    .values({
      key: COLOR_TRAIT_SET_KEY,
      label: "Standard Color Palette",
      description:
        "Standardized color names and swatches for Klados, derived from a simplified ISCC-like scheme.",
    })
    .returning();

  return inserted;
}

/**
 * Upsert all canonical colors for a trait set inside a transaction.
 */
async function upsertCanonicalColorsTx(
  tx: Transaction,
  setId: number,
  colors: ColorDef[]
) {
  for (const color of colors) {
    await tx
      .insert(categoricalTraitValue)
      .values({
        setId,
        key: color.key,
        label: color.label,
        isCanonical: true,
        canonicalValueId: null,
        hexCode: color.hexCode,
      })
      .onConflictDoUpdate({
        target: [categoricalTraitValue.setId, categoricalTraitValue.key],
        set: {
          label: color.label,
          hexCode: color.hexCode,
          isCanonical: true,
          canonicalValueId: null,
          updatedAt: new Date(),
        },
      });
  }
}

/**
 * Validate and upsert aliases for the "colors" trait set inside a transaction.
 */
async function syncColorAliasesTx(tx: Transaction, setId: number) {
  // Load canonical rows (for IDs + keys)
  const canonicalRows = await tx
    .select()
    .from(categoricalTraitValue)
    .where(
      and(
        eq(categoricalTraitValue.setId, setId),
        eq(categoricalTraitValue.isCanonical, true)
      )
    );

  const canonicalByKey = new Map<string, (typeof canonicalRows)[number]>(
    canonicalRows.map((row) => [row.key, row])
  );
  const canonicalKeys = new Set(canonicalByKey.keys());

  const aliases = getNormalizedColorAliases();
  const errors: string[] = [];
  const aliasKeyToCanonical = new Map<string, string>();

  // Config-level validation first
  for (const alias of aliases) {
    const { aliasLabel, aliasKey, canonicalKey } = alias;

    if (!canonicalByKey.has(canonicalKey)) {
      errors.push(
        `Alias "${aliasLabel}" uses canonicalKey "${canonicalKey}", but no canonical color with that key exists.`
      );
    }

    if (canonicalKeys.has(aliasKey)) {
      errors.push(
        `Alias "${aliasLabel}" uses aliasKey "${aliasKey}", which collides with an existing canonical key.`
      );
    }

    const existingCanonicalForAlias = aliasKeyToCanonical.get(aliasKey);
    if (
      existingCanonicalForAlias &&
      existingCanonicalForAlias !== canonicalKey
    ) {
      errors.push(
        `Alias key "${aliasKey}" is mapped to multiple canonical keys: "${existingCanonicalForAlias}" and "${canonicalKey}".`
      );
    } else if (!existingCanonicalForAlias) {
      aliasKeyToCanonical.set(aliasKey, canonicalKey);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Alias configuration errors:\n${errors.map((e) => `  - ${e}`).join("\n")}`
    );
  }

  // Upsert aliases
  for (const alias of aliases) {
    const canonical = canonicalByKey.get(alias.canonicalKey)!;

    await tx
      .insert(categoricalTraitValue)
      .values({
        setId,
        key: alias.aliasKey,
        label: alias.aliasLabel,
        isCanonical: false,
        canonicalValueId: canonical.id,
        hexCode: null, // don't set hexCode on aliases
      })
      .onConflictDoUpdate({
        target: [categoricalTraitValue.setId, categoricalTraitValue.key],
        set: {
          label: alias.aliasLabel,
          isCanonical: false,
          canonicalValueId: canonical.id,
          hexCode: null,
          updatedAt: new Date(),
        },
      });
  }
}

export async function run() {
  const colors = generateCanonicalColorDefs();

  console.log("\n=== Preview: Standard Color Palette ===\n");
  console.log(`Total colors: ${colors.length}\n`);

  for (const c of colors) {
    if (c.hexCode) {
      console.log(
        `${c.label.padEnd(32)} ${ansiBlock(c.hexCode)}  ${c.hexCode}`
      );
    } else {
      console.log(`${c.label.padEnd(32)} [no swatch / no hex]`);
    }
  }

  console.log();
  const shouldProceed = await askYesNo(
    "Proceed with upserting these colors into the database? (y/N) "
  );

  if (!shouldProceed) {
    console.log("\nAborted. No database changes were made.\n");
    process.exit(0);
  }

  console.log("\nUpserting colors and aliases into DB...\n");

  await db.transaction(async (tx) => {
    const traitSet = await getOrCreateColorTraitSetTx(tx);

    await upsertCanonicalColorsTx(tx, traitSet.id, colors);
    await syncColorAliasesTx(tx, traitSet.id);
  });

  console.log(
    `\nDone. Seeded canonical colors and aliases into set "${COLOR_TRAIT_SET_KEY}".\n`
  );
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
