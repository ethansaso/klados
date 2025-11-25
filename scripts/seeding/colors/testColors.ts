import { BASE_HUE_NAMES } from "./const";
import { expandHueRow, getNeutralColors } from "./util";

function ansiBlock(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `\x1b[48;2;${r};${g};${b}m  \x1b[0m`;
}

function printColor(name: string, hex: string) {
  console.log(`${name.padEnd(30)} ${ansiBlock(hex)}  ${hex}`);
}

function run() {
  console.log("\n=== Neutral Colors ===\n");
  for (const c of getNeutralColors()) {
    printColor(c.name, c.hex);
  }

  console.log("\n=== Hue-derived Colors ===\n");

  BASE_HUE_NAMES.forEach(([lightHue, baseHue, darkHue], rowIndex) => {
    console.log(`\n--- ${baseHue.toUpperCase()} GROUP ---\n`);
    const colors = expandHueRow(rowIndex, lightHue, baseHue, darkHue);
    for (const c of colors) {
      printColor(c.name, c.hex);
    }
  });
}

run();
