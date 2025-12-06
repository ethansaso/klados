import "dotenv/config";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { db, pool } from "./client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(__dirname, "./migrations");

async function main() {
  await migrate(db, { migrationsFolder });
  await pool.end();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
