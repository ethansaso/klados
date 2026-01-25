import { sql } from "drizzle-orm";
import { PgColumnBuilder, timestamp } from "drizzle-orm/pg-core";

export function withTimestamps<T extends Record<string, PgColumnBuilder>>(
  cols: T,
) {
  const createdAt = timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull();
  const updatedAt = timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => sql`NOW()`);

  return {
    ...cols,
    createdAt,
    updatedAt,
  } as T & {
    createdAt: typeof createdAt;
    updatedAt: typeof updatedAt;
  };
}
