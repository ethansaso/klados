import "dotenv/config";
import { db } from "../../../db/client";
import { unit, unitFamily } from "../../../db/schema/characters/units";
import type { Transaction } from "../../../src/lib/utils/transactionType";
import { askYesNo } from "../../utils/askYesNo";

type FamilyDef = {
  label: string;
};

type UnitDef = {
  familyLabel: string;
  key: string; // canonical token, ASCII-safe (e.g. "um", "mm2", "deg")
  symbol: string; // display symbol (e.g. "µm", "mm²", "°")
  scale: string; // numeric string for exactness
};

const families: FamilyDef[] = [
  { label: "Length" },
  { label: "Area" },
  { label: "Weight" },
  { label: "Angle" },
  { label: "Dimensionless" },
];

const units: UnitDef[] = [
  // LENGTH (base: meter)
  { familyLabel: "Length", key: "nm", symbol: "nm", scale: "1e-9" },
  { familyLabel: "Length", key: "um", symbol: "µm", scale: "1e-6" },
  { familyLabel: "Length", key: "mm", symbol: "mm", scale: "1e-3" },
  { familyLabel: "Length", key: "cm", symbol: "cm", scale: "1e-2" },
  { familyLabel: "Length", key: "m", symbol: "m", scale: "1" },
  { familyLabel: "Length", key: "in", symbol: "in", scale: "0.0254" },
  { familyLabel: "Length", key: "ft", symbol: "ft", scale: "0.3048" },

  // AREA (base: square meter)
  { familyLabel: "Area", key: "nm2", symbol: "nm²", scale: "1e-18" },
  { familyLabel: "Area", key: "um2", symbol: "µm²", scale: "1e-12" },
  { familyLabel: "Area", key: "mm2", symbol: "mm²", scale: "1e-6" },
  { familyLabel: "Area", key: "cm2", symbol: "cm²", scale: "1e-4" },
  { familyLabel: "Area", key: "m2", symbol: "m²", scale: "1" },
  { familyLabel: "Area", key: "in2", symbol: "in²", scale: "0.00064516" }, // (0.0254)^2
  { familyLabel: "Area", key: "ft2", symbol: "ft²", scale: "0.09290304" }, // (0.3048)^2

  // WEIGHT (base: kilogram)
  { familyLabel: "Weight", key: "mg", symbol: "mg", scale: "1e-6" },
  { familyLabel: "Weight", key: "g", symbol: "g", scale: "1e-3" },
  { familyLabel: "Weight", key: "kg", symbol: "kg", scale: "1" },
  { familyLabel: "Weight", key: "lb", symbol: "lb", scale: "0.45359237" },
  { familyLabel: "Weight", key: "oz", symbol: "oz", scale: "0.028349523125" },

  // ANGLE (base: degree)
  { familyLabel: "Angle", key: "deg", symbol: "°", scale: "1" },

  // DIMENSIONLESS: intentionally no unit rows
];

async function upsertFamiliesTx(tx: Transaction) {
  for (const fam of families) {
    await tx
      .insert(unitFamily)
      .values({ label: fam.label })
      .onConflictDoUpdate({
        target: [unitFamily.label],
        set: {
          label: fam.label,
          updatedAt: new Date(),
        },
      });
  }
}

async function loadFamilyIdByLabelTx(tx: Transaction) {
  const rows = await tx
    .select({ id: unitFamily.id, label: unitFamily.label })
    .from(unitFamily);

  const map = new Map<string, number>();
  for (const r of rows) map.set(r.label, r.id);
  return map;
}

async function upsertUnitsTx(
  tx: Transaction,
  familyIdByLabel: Map<string, number>,
) {
  for (const u of units) {
    const familyId = familyIdByLabel.get(u.familyLabel);
    if (!familyId) {
      throw new Error(
        `Missing unitFamily "${u.familyLabel}" for unit "${u.key}"`,
      );
    }

    await tx
      .insert(unit)
      .values({
        familyId,
        key: u.key,
        symbol: u.symbol,
        scale: u.scale,
      })
      .onConflictDoUpdate({
        target: [unit.familyId, unit.key],
        set: {
          symbol: u.symbol,
          scale: u.scale,
          updatedAt: new Date(),
        },
      });
  }
}

export async function run() {
  // Preview
  console.log("\n=== Preview: Unit Families ===\n");
  for (const f of families) {
    console.log(`- ${f.label}`);
  }

  console.log("\n=== Preview: Units ===\n");
  const byFamily = new Map<string, UnitDef[]>();
  for (const u of units) {
    const arr = byFamily.get(u.familyLabel) ?? [];
    arr.push(u);
    byFamily.set(u.familyLabel, arr);
  }

  for (const fam of families) {
    console.log(`\n[${fam.label}]`);
    const arr = byFamily.get(fam.label) ?? [];
    if (arr.length === 0) {
      console.log("  (no units)");
      continue;
    }

    for (const u of arr) {
      console.log(
        `  ${u.key.padEnd(6)}  ${u.symbol.padEnd(4)}  scale=${u.scale}`,
      );
    }
  }

  console.log();
  const shouldProceed = await askYesNo(
    "Proceed with upserting these unit families and units into the database? (y/N) ",
  );
  if (!shouldProceed) {
    console.log("\nAborted. No database changes were made.\n");
    process.exit(0);
  }

  console.log("\nUpserting unit families and units into DB...\n");

  await db.transaction(async (tx) => {
    // 1) Families first
    await upsertFamiliesTx(tx);

    // 2) Load IDs, then units
    const familyIdByLabel = await loadFamilyIdByLabelTx(tx);

    // 3) Units (dimensionless intentionally has none)
    await upsertUnitsTx(tx, familyIdByLabel);
  });

  console.log("\nDone. Seeded unit families + units.\n");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
