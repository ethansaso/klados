import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema/schema";

const url =
  process.env.DATABASE_URL || "postgres://app:app@127.0.0.1:5432/taxokeys";
const u = new URL(url);

export const pool = new Pool({
  host: u.hostname || "127.0.0.1",
  port: Number(u.port || 5432),
  user: decodeURIComponent(u.username || "app"),
  password: decodeURIComponent(u.password || "app"),
  database: (u.pathname || "/taxokeys").slice(1) || "taxokeys",
  // ssl: { rejectUnauthorized: false }, // enable in prod if needed
});

export const db = drizzle(pool, { schema });
