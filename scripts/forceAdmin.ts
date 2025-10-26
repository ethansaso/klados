import { db, pool } from "../src/db/client";
import { user } from "../src/db/schema/auth";

async function main() {
    await db.update(user).set({role: "admin"})
}

main()
  .then(() => console.log("Made all users admin"))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());