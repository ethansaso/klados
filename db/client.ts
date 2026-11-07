import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { relations } from "./schema/relations";

// ! Required to avoid dead connection hanging server
const CONNECTION_TIMEOUT_MS = 10_000;
const QUERY_TIMEOUT_MS = 30_000;
const KEEPALIVE_DELAY_MS = 10_000;

const url =
  process.env.DATABASE_URL || "postgres://app:app@127.0.0.1:5434/taxokeys";
const u = new URL(url);

export const pool = new Pool({
  host: u.hostname || "127.0.0.1",
  port: Number(u.port || 5434),
  user: decodeURIComponent(u.username || "app"),
  password: decodeURIComponent(u.password || "app"),
  database: (u.pathname || "/taxokeys").slice(1) || "taxokeys",
  connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
  query_timeout: QUERY_TIMEOUT_MS,
  statement_timeout: QUERY_TIMEOUT_MS,
  idle_in_transaction_session_timeout: QUERY_TIMEOUT_MS,
  keepAlive: true,
  keepAliveInitialDelayMillis: KEEPALIVE_DELAY_MS,
});

// ? Idle clients that die emit here; pg-pool already discards them, but an unhandled 'error' event would throw.
pool.on("error", (err) => {
  console.error("[db] idle client error", err);
});

export const db = drizzle({ client: pool, relations });

export async function closeDb() {
  await pool.end();
}
