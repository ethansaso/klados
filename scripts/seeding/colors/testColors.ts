import {
  ansiBlock,
  generateCanonicalColorDefs,
  getNormalizedColorAliases,
} from "./util";

function printColor(name: string, hex: string) {
  console.log(`${name.padEnd(30)} ${ansiBlock(hex)}  ${hex}`);
}

function run() {
  console.log("\n=== Full Color List (Canonicals + Aliases) ===\n");

  const canonicalDefs = generateCanonicalColorDefs();

  const aliases = getNormalizedColorAliases();

  // Group aliases by canonical label
  const groupedAliases = new Map<string, string[]>();
  for (const alias of aliases) {
    if (!groupedAliases.has(alias.canonicalLabel)) {
      groupedAliases.set(alias.canonicalLabel, []);
    }
    groupedAliases.get(alias.canonicalLabel)!.push(alias.aliasLabel);
  }

  for (const canonical of canonicalDefs) {
    const aliasLabels = groupedAliases.get(canonical.label) ?? [];

    // Canonical header: two cases: hex or no-hex (e.g., "colorless")
    if (canonical.hexCode) {
      printColor(canonical.label, canonical.hexCode);
    } else {
      console.log(`${canonical.label.padEnd(30)} ⬚`);
    }

    // Aliases
    if (aliasLabels.length > 0) {
      for (const label of aliasLabels) {
        console.log(`    - ${label}`);
      }
    }
  }
}

run();
