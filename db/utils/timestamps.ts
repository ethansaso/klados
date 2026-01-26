import { sql } from "drizzle-orm";
import { timestamp, type AnyPgColumnBuilder } from "drizzle-orm/pg-core";

export function withTimestamps<T extends Record<string, AnyPgColumnBuilder>>(
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
