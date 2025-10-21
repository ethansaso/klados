import { sql } from "drizzle-orm";
import { PgColumnBuilderBase, timestamp } from "drizzle-orm/pg-core";

export function withTimestamps<T extends Record<string, PgColumnBuilderBase>>(
  cols: T
) {
  return {
    ...cols,
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  } as T & {
    createdAt: ReturnType<typeof timestamp>;
    updatedAt: ReturnType<typeof timestamp>;
  };
}

export function withTouch<T extends Record<string, unknown>>(
  changes: T
): T & { updatedAt: unknown } {
  return { ...changes, updatedAt: sql`NOW()` };
}
