import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { db } from "../../../db/client";
import {
  categoricalCharacterMeta,
  categoricalTraitValue,
  character,
} from "../../../db/schema/schema";
import { Transaction } from "../../../src/lib/utils/transactionType";
import { askYesNo } from "../../utils/askYesNo";
import {
  ansiBlock,
  ColorDef,
  generateCanonicalColorDefs,
  getNormalizedColorAliases,
} from "../colors/util";

const COLOR_CHARACTER_LABEL = "Color";

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
        description:
          "Standardized color names and swatches for Klados, derived from a simplified ISCC-like scheme.",
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
 * Upsert all canonical colors for a character inside a transaction.
 */
async function upsertCanonicalColorsTx(
  tx: Transaction,
  characterId: number,
  colors: ColorDef[],
) {
  for (const color of colors) {
    await tx
      .insert(categoricalTraitValue)
      .values({
        characterId,
        label: color.label,
        isCanonical: true,
        canonicalValueId: null,
        hexCode: color.hexCode,
      })
      .onConflictDoUpdate({
        target: [
          categoricalTraitValue.characterId,
          categoricalTraitValue.label,
        ],
        set: {
          hexCode: color.hexCode,
          isCanonical: true,
          canonicalValueId: null,
          updatedAt: new Date(),
        },
      });
  }
}

/**
 * Validate and upsert aliases for the "Color" character inside a transaction.
 */
async function syncColorAliasesTx(tx: Transaction, characterId: number) {
  const canonicalRows = await tx
    .select()
    .from(categoricalTraitValue)
    .where(
      and(
        eq(categoricalTraitValue.characterId, characterId),
        eq(categoricalTraitValue.isCanonical, true),
      ),
    );

  const canonicalByLabel = new Map(
    canonicalRows.map((row) => [row.label, row]),
  );
  const canonicalLabels = new Set(canonicalByLabel.keys());

  const aliases = getNormalizedColorAliases();
  const errors: string[] = [];
  const aliasLabelToCanonical = new Map<string, string>();

  for (const alias of aliases) {
    const { aliasLabel, canonicalLabel } = alias;

    if (!canonicalByLabel.has(canonicalLabel)) {
      errors.push(
        `Alias "${aliasLabel}" references canonical label "${canonicalLabel}", but no canonical color with that label exists.`,
      );
    }

    if (canonicalLabels.has(aliasLabel)) {
      errors.push(
        `Alias "${aliasLabel}" collides with an existing canonical label.`,
      );
    }

    const existingCanonicalForAlias = aliasLabelToCanonical.get(aliasLabel);
    if (
      existingCanonicalForAlias &&
      existingCanonicalForAlias !== canonicalLabel
    ) {
      errors.push(
        `Alias label "${aliasLabel}" is mapped to multiple canonicals: "${existingCanonicalForAlias}" and "${canonicalLabel}".`,
      );
    } else if (!existingCanonicalForAlias) {
      aliasLabelToCanonical.set(aliasLabel, canonicalLabel);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Alias configuration errors:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
    );
  }

  for (const alias of aliases) {
    const canonical = canonicalByLabel.get(alias.canonicalLabel)!;

    await tx
      .insert(categoricalTraitValue)
      .values({
        characterId,
        label: alias.aliasLabel,
        isCanonical: false,
        canonicalValueId: canonical.id,
        hexCode: null,
      })
      .onConflictDoUpdate({
        target: [
          categoricalTraitValue.characterId,
          categoricalTraitValue.label,
        ],
        set: {
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
        `${c.label.padEnd(32)} ${ansiBlock(c.hexCode)}  ${c.hexCode}`,
      );
    } else {
      console.log(`${c.label.padEnd(32)} [no swatch / no hex]`);
    }
  }

  console.log();
  const shouldProceed = await askYesNo(
    "Proceed with upserting these colors into the database? (y/N) ",
  );

  if (!shouldProceed) {
    console.log("\nAborted. No database changes were made.\n");
    process.exit(0);
  }

  console.log("\nUpserting colors and aliases into DB...\n");

  await db.transaction(async (tx) => {
    const colorCharacter = await getOrCreateColorCharacterTx(tx);

    await upsertCanonicalColorsTx(tx, colorCharacter.id, colors);
    await syncColorAliasesTx(tx, colorCharacter.id);
  });

  console.log(
    `\nDone. Seeded canonical colors and aliases into character "${COLOR_CHARACTER_LABEL}".\n`,
  );
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
