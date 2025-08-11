import { timestamp } from "drizzle-orm/pg-core";

export function withTimestamps<T extends Record<string, any>>(cols: T) {
  return {
    ...cols,
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  } as const;
}