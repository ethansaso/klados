import { db } from "../../../../db/client";
import {
  deleteSourceById,
  insertSource,
  listSourcesQuery,
  selectSourceById,
  selectSourceByUniqueKeys,
} from "./repo";
import type { SourceSearchParams } from "./search";
import type { SourceDTO, SourcePaginatedResult } from "./types";
import type { SourceItem } from "./validation";

/**
 * Create a source.
 */
export async function createSource(args: SourceItem): Promise<SourceDTO> {
  return db.transaction(async (tx) => {
    const isbn = args.isbn ?? null;
    const url = args.url ?? null;

    // Return existing source if one exists with same unique keys.
    const existing = await selectSourceByUniqueKeys(tx, { isbn, url });
    if (existing) return existing;

    const created = await insertSource(tx, args);
    return created;
  });
}

/**
 * Get a single source by id.
 */
export async function getSource(args: {
  id: number;
}): Promise<SourceDTO | null> {
  return db.transaction(async (tx) => {
    const src = await selectSourceById(tx, args.id);
    return src;
  });
}

/**
 * List sources with optional search + ordering, paginated.
 */
export async function listSources(
  args: SourceSearchParams,
): Promise<SourcePaginatedResult> {
  return listSourcesQuery(args);
}

/**
 * Delete a source by id.
 * Returns { id } if deleted, or null if it does not exist.
 */
export async function deleteSource(args: {
  id: number;
}): Promise<{ id: number } | null> {
  return db.transaction(async (tx) => {
    const deleted = await deleteSourceById(tx, args.id);
    return deleted;
  });
}
