import { ansiBlock, buildColorSeedPlan } from "./util";

function run() {
  console.log("\n=== Full Color List (Synonym Sets) ===\n");

  const plan = buildColorSeedPlan();

  for (const color of plan) {
    if (color.hexCode) {
      console.log(
        `${color.label.padEnd(30)} ${ansiBlock(color.hexCode)}  ${color.hexCode}`,
      );
    } else {
      console.log(`${color.label.padEnd(30)} ⬚`);
    }

    for (const synonym of color.synonyms) {
      console.log(`    - ${synonym}`);
    }
  }

  console.log(
    `\n${plan.length} colors, ${plan.reduce((n, c) => n + 1 + c.synonyms.length, 0)} labels\n`,
  );
}

run();
