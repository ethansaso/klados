#!/usr/bin/env tsx
import "dotenv/config";
import { closeDb } from "../src/db/client";
import { generateKeyForTaxa } from "../src/keygen/generateKey";

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error(`
Usage:
  npx tsx scripts/run-keygen.ts <id1> <id2> ...

Example:
  npx tsx scripts/run-keygen.ts 12 55 900
`);
  process.exit(1);
}

// Convert to numbers and validate
const ids = args.map((raw, i) => {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    console.error(`Invalid taxon id at arg ${i + 1}: "${raw}"`);
    process.exit(1);
  }
  return n;
});

// ---- MAIN ----
async function main() {
  try {
    console.log("Running keygen for taxon IDs:", ids);
    await generateKeyForTaxa(ids);
    console.log("\nDone.");
  } catch (err) {
    console.error("Script error:", err);
    process.exit(1);
  } finally {
    await closeDb();
  }
}

main();
