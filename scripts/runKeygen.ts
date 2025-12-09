#!/usr/bin/env tsx
import "dotenv/config";
import { closeDb } from "../src/db/client";
import { generateKeyForTaxon } from "../src/keygen/generateKey";
import { normalizeKeyGenOptions } from "../src/keygen/options";

type CliOptions = {
  rootId: number;
  taxonLimit?: number;
};

function parseArgs(argv: string[]): CliOptions {
  if (argv.length === 0) {
    console.error(`
Usage:
  npx tsx scripts/run-keygen.ts <rootTaxonId> [--limit <maxTaxa>]

Examples:
  npx tsx scripts/run-keygen.ts 42
  npx tsx scripts/run-keygen.ts 42 --limit 1000
`);
    process.exit(1);
  }

  const positional: string[] = [];
  let taxonLimit: number | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--limit" || arg === "-l") {
      const next = argv[++i];
      if (!next) {
        console.error(`Missing value after ${arg}`);
        process.exit(1);
      }
      const n = Number(next);
      if (!Number.isFinite(n) || n <= 0) {
        console.error(`Invalid --limit value: "${next}"`);
        process.exit(1);
      }
      taxonLimit = n;
      continue;
    }

    // Anything else is treated as positional (root ID)
    positional.push(arg);
  }

  if (positional.length === 0) {
    console.error("Missing <rootTaxonId>.");
    process.exit(1);
  }
  if (positional.length > 1) {
    console.warn(
      `Multiple IDs provided (${positional.join(
        ", "
      )}); using the first (${positional[0]}) as root.`
    );
  }

  const rootRaw = positional[0];
  const rootId = Number(rootRaw);
  if (!Number.isFinite(rootId) || rootId <= 0) {
    console.error(`Invalid root taxon id: "${rootRaw}"`);
    process.exit(1);
  }

  return { rootId, taxonLimit };
}

async function main() {
  const { rootId, taxonLimit } = parseArgs(process.argv.slice(2));

  try {
    console.log("Running keygen for root taxon ID:", rootId);
    if (taxonLimit) {
      console.log(`Taxon limit: ${taxonLimit}`);
    }

    const options = normalizeKeyGenOptions({ taxonLimit });

    const result = await generateKeyForTaxon(rootId, options);

    console.log(`\nDone.\nOutput:\n\n`);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Script error:", err);
    process.exit(1);
  } finally {
    await closeDb();
  }
}

main();
