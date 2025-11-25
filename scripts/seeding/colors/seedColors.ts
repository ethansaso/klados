// scripts/seeds/seedColors.ts

import "dotenv/config";
import { eq } from "drizzle-orm";
import readline from "node:readline";
import { db } from "../../../src/db/client";
import {
  categoricalTraitSet,
  categoricalTraitValue,
} from "../../../src/db/schema/schema";
import { capitalizeWord, snakeCase } from "../../utils/case";
import { ansiBlock, getAllHueColors, getNeutralColors } from "../colors/util";

type ColorDef = {
  key: string; // machine key (snake_case)
  label: string; // human label
  hexCode: string;
};

const COLOR_TRAIT_SET_KEY = "colors";

// -----------------------------------------------------------------------------
// Generators
// -----------------------------------------------------------------------------

function generateNeutralColors(): ColorDef[] {
  return getNeutralColors().map(({ name, hex }) => {
    const rawLabel = name.replace(/-/g, " "); // light-gray → light gray
    const label = rawLabel
      .split(/\s+/)
      .map((w) => capitalizeWord(w))
      .join(" ");
    const key = snakeCase(label);
    return { key, label, hexCode: hex };
  });
}

function generateHueColors(): ColorDef[] {
  const groups = getAllHueColors();
  const colors: ColorDef[] = [];

  for (const group of groups) {
    for (const c of group.colors) {
      // c.name is already something like "grayish pink", "dark grayish red-brown"
      const label = c.name
        .split(/\s+/)
        .map((word) =>
          word
            .split("-")
            .map((w) => capitalizeWord(w))
            .join("-")
        )
        .join(" ");
      const key = snakeCase(label);
      colors.push({ key, label, hexCode: c.hex });
    }
  }

  // Deduplicate by key, last one wins (shouldn't really collide).
  const byKey = new Map<string, ColorDef>();
  for (const c of colors) {
    byKey.set(c.key, c);
  }

  return Array.from(byKey.values());
}

function generateAllColors(): ColorDef[] {
  const neutrals = generateNeutralColors();
  const hues = generateHueColors();

  const byKey = new Map<string, ColorDef>();

  for (const c of [...neutrals, ...hues]) {
    byKey.set(c.key, c);
  }

  return Array.from(byKey.values());
}

// -----------------------------------------------------------------------------
// DB helpers
// -----------------------------------------------------------------------------

async function getOrCreateColorTraitSet() {
  const existing = await db
    .select()
    .from(categoricalTraitSet)
    .where(eq(categoricalTraitSet.key, COLOR_TRAIT_SET_KEY))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const [inserted] = await db
    .insert(categoricalTraitSet)
    .values({
      key: COLOR_TRAIT_SET_KEY,
      label: "Standard Color Palette",
      description:
        "Standardized color names and swatches for TaxoKeys, derived from a simplified ISCC-like scheme.",
    })
    .returning();

  return inserted;
}

async function upsertCanonicalColor(
  setId: number,
  color: ColorDef
): Promise<void> {
  await db
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

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

export async function run() {
  const colors = generateAllColors();

  console.log("\n=== Preview: Standard Color Palette ===\n");
  console.log(`Total colors: ${colors.length}\n`);

  for (const c of colors) {
    console.log(`${c.label.padEnd(32)} ${ansiBlock(c.hexCode)}  ${c.hexCode}`);
  }

  console.log();
  const shouldProceed = await askYesNo(
    "Proceed with upserting these colors into the database? (y/N) "
  );

  if (!shouldProceed) {
    console.log("\nAborted. No database changes were made.\n");
    process.exit(0);
  }

  console.log("\nUpserting colors into DB...\n");

  const traitSet = await getOrCreateColorTraitSet();

  for (const color of colors) {
    await upsertCanonicalColor(traitSet.id, color);
  }

  console.log(
    `\nDone. Seeded ${colors.length} canonical colors into set "${COLOR_TRAIT_SET_KEY}".\n`
  );
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
