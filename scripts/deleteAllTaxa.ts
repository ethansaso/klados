// TODO: get this file out of the codebase before deploy

import { db, pool } from "../src/db/client";
import { user } from "../src/db/schema/auth";
import { taxa } from "../src/db/schema/schema";

async function main() {
  await db.delete(taxa);
}

main()
  .then(() => console.log("Deleted all taxa!"))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
