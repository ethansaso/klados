import { like, sql, type Column, type SQL } from "drizzle-orm";

/**
 * Case-insensitive LIKE that can use a `lower(column) gin_trgm_ops` index,
 * which ILIKE can't, since it doesn't match the index expression.
 */
export function lowerLike(column: Column, pattern: string): SQL {
  return like(sql`lower(${column})`, sql`lower(${pattern})`);
}
