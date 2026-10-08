import { buildColorPalette } from "../../../src/lib/domain/traits/colorPalette";
import { ansiBlock } from "./ansiBlock";

function run() {
  console.log("\n=== Canonical Colors ===\n");

  const palette = buildColorPalette();

  for (const color of palette) {
    if (color.hexCode) {
      console.log(
        `${color.label.padEnd(30)} ${ansiBlock(color.hexCode)}  ${color.hexCode}`,
      );
    } else {
      console.log(`${color.label.padEnd(30)} ⬚`);
    }
  }

  console.log(`\n${palette.length} colors\n`);
}

run();
