import "dotenv/config";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./client";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

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
