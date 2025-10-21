import { timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export function withTimestamps<T extends Record<string, any>>(cols: T) {
  return {
    ...cols,
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  } as const;
}

export function withTouch<T extends Record<string, unknown>>(
  changes: T
): T & { updatedAt: unknown } {
  return { ...changes, updatedAt: sql`NOW()` };
}
