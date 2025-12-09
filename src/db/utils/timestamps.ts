import { sql } from "drizzle-orm";
import { PgColumnBuilderBase, timestamp } from "drizzle-orm/pg-core";

export function withTimestamps<T extends Record<string, PgColumnBuilderBase>>(
  cols: T
) {
  const createdAt = timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull();
  const updatedAt = timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull();

  return {
    ...cols,
    createdAt,
    updatedAt,
  } as T & {
    createdAt: typeof createdAt;
    updatedAt: typeof updatedAt;
  };
}

export function withTouch<T extends Record<string, unknown>>(
  changes: T
): T & { updatedAt: unknown } {
  return { ...changes, updatedAt: sql`NOW()` };
}
