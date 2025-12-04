import { db } from "../../../db/client";
import {
  deleteTraitSetById,
  fetchTraitSetDetailById,
  getTraitSetValuesQuery,
  insertTraitSet,
  insertTraitValueRow,
  listTraitSetsQuery,
  selectTraitValueDtoById,
  selectTraitValueDtosByIds,
  selectTraitValueRowById,
} from "./repo";
import type {
  TraitSetDetailDTO,
  TraitSetDTO,
  TraitSetPaginatedResult,
  TraitValueDTO,
} from "./types";

/**
 * List trait sets with optional search, status filter and IDs, paginated.
 */
export async function listTraitSets(args: {
  q?: string;
  ids?: number[];
  page: number;
  pageSize: number;
}): Promise<TraitSetPaginatedResult> {
  return listTraitSetsQuery(args);
}

/**
 * Get a single trait set with aggregates.
 */
export async function getTraitSet(args: {
  id: number;
}): Promise<TraitSetDetailDTO | null> {
  return fetchTraitSetDetailById(args.id);
}

/**
 * Create a trait set.
 */
export async function createTraitSet(args: {
  key: string;
  label: string;
  description?: string;
}): Promise<TraitSetDTO | null> {
  const key = args.key.trim();
  const label = args.label.trim();
  const description = args.description?.trim() || "";

  return db.transaction(async (tx) => {
    const base = await insertTraitSet(tx, { key, label, description });
    if (!base) {
      return null;
    }

    const dto: TraitSetDTO = {
      ...base,
      valueCount: 0,
      canonicalCount: 0,
      usedByCharacters: 0,
    };

    return dto;
  });
}

/**
 * Delete a trait set by id.
 * Returns { id } if deleted, null if the set does not exist.
 */
export async function deleteTraitSet(args: {
  id: number;
}): Promise<{ id: number } | null> {
  const { id } = args;
  return db.transaction(async (tx) => {
    const deleted = await deleteTraitSetById(tx, id);
    return deleted;
  });
}

/**
 * Gets all values for a given trait set.
 */
export async function getTraitSetValues(args: {
  setId: number;
}): Promise<TraitValueDTO[]> {
  return getTraitSetValuesQuery(args.setId);
}

/**
 * Bulk fetch trait values by ID.
 */
export async function getTraitValuesByIds(
  ids: number[]
): Promise<TraitValueDTO[]> {
  if (!ids.length) {
    return [];
  }

  const dtos = await db.transaction(async (tx) => {
    return selectTraitValueDtosByIds(tx, ids);
  });

  return dtos;
}

/**
 * Create a trait value (canonical or alias).
 *
 * Applies alias invariants:
 *  - target exists
 *  - same set
 *  - target is canonical
 */
export async function createTraitValue(args: {
  setId: number;
  key: string;
  label: string;
  canonicalValueId?: number | null;
}): Promise<TraitValueDTO> {
  const setId = args.setId;
  const key = args.key.trim();
  const label = args.label.trim();
  const canonicalValueId = args.canonicalValueId ?? null;

  return db.transaction(async (tx) => {
    // If alias, verify the target exists, is in the same set, and is canonical.
    if (canonicalValueId) {
      const target = await selectTraitValueRowById(tx, canonicalValueId);
      if (!target) {
        throw new Error("Alias target not found.");
      }
      if (target.setId !== setId) {
        throw new Error("Alias target must be in the same trait set.");
      }
      if (!target.isCanonical) {
        throw new Error("Alias target must be canonical.");
      }
    }

    const inserted = await insertTraitValueRow(tx, {
      setId,
      key,
      label,
      isCanonical: !canonicalValueId,
      canonicalValueId,
    });

    if (!inserted) {
      throw new Error("Insert failed.");
    }

    const dto = await selectTraitValueDtoById(tx, inserted.id);
    if (!dto) {
      throw new Error("Inserted row not found.");
    }

    return dto;
  });
}
