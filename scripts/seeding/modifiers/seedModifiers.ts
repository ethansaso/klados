// import { askYesNo } from "../../utils/askYesNo";

// export async function run() {
//   // Preview
//   console.log("\n=== Preview: Unit Families ===\n");
//   for (const f of families) {
//     console.log(`- ${f.label}`);
//   }

//   console.log("\n=== Preview: Units ===\n");
//   const byFamily = new Map<string, UnitDef[]>();
//   for (const u of units) {
//     const arr = byFamily.get(u.familyLabel) ?? [];
//     arr.push(u);
//     byFamily.set(u.familyLabel, arr);
//   }

//   for (const fam of families) {
//     console.log(`\n[${fam.label}]`);
//     const arr = byFamily.get(fam.label) ?? [];
//     if (arr.length === 0) {
//       console.log("  (no units)");
//       continue;
//     }

//     for (const u of arr) {
//       console.log(
//         `  ${u.key.padEnd(6)}  ${u.symbol.padEnd(4)}  scale=${u.scale}`
//       );
//     }
//   }

//   console.log();
//   const shouldProceed = await askYesNo(
//     "Proceed with upserting these unit families and units into the database? (y/N) "
//   );
//   if (!shouldProceed) {
//     console.log("\nAborted. No database changes were made.\n");
//     process.exit(0);
//   }

//   console.log("\nUpserting unit families and units into DB...\n");

//   await db.transaction(async (tx) => {
//     // 1) Families first
//     await upsertFamiliesTx(tx);

//     // 2) Load IDs, then units
//     const familyIdByLabel = await loadFamilyIdByLabelTx(tx);

//     // 3) Units (dimensionless intentionally has none)
//     await upsertUnitsTx(tx, familyIdByLabel);
//   });

//   console.log("\nDone. Seeded unit families + units.\n");
//   process.exit(0);
// }

// run().catch((err) => {
//   console.error(err);
//   process.exit(1);
// });
