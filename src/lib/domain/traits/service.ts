import { db } from "../../../db/client";
import {
  deleteTraitSetById,
  deleteTraitValueById,
  fetchTraitSetDetailById,
  getTraitSetValuesQuery,
  insertTraitSet,
  insertTraitValueRow,
  listTraitSetsQuery,
  listTraitSetValuesQuery,
  selectTraitValueDtoById,
  selectTraitValueDtosByIds,
  selectTraitValueRowById,
  updateTraitValueRow,
} from "./repo";
import type {
  TraitSetDetailDTO,
  TraitSetDTO,
  TraitSetPaginatedResult,
  TraitValueDTO,
  TraitValuePaginatedResult,
} from "./types";
import { UpdateTraitValueInput } from "./validation";

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
 * Delete a trait value by id.
 * Returns { id } if deleted, null if the value does not exist.
 */
export async function deleteTraitValue(args: {
  id: number;
}): Promise<{ id: number } | null> {
  const { id } = args;

  return db.transaction(async (tx) => {
    const dto = await selectTraitValueDtoById(tx, id);
    if (!dto) return null;

    // Block delete if referenced by a state(s)
    if (dto.usageCount > 0) {
      throw new Error(
        `Cannot delete "${dto.label}" because it is used by ${dto.usageCount} taxon character state(s).`
      );
    }

    // Block delete if has dependent aliases
    if (!dto.aliasTarget && (dto.aliasCount ?? 0) > 0) {
      throw new Error(
        `Cannot delete "${dto.label}" because ${dto.aliasCount} alias value(s) depend on it. Remove or reassign those aliases first.`
      );
    }

    const deleted = await deleteTraitValueById(tx, id);
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
 * Lists paginated trait values for a given trait set.
 */
export async function listTraitSetValues(args: {
  setId: number;
  page: number;
  pageSize: number;
  kind?: "canonical" | "alias";
  q?: string;
}): Promise<TraitValuePaginatedResult> {
  return listTraitSetValuesQuery(args);
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

export async function updateTraitValue(
  args: UpdateTraitValueInput
): Promise<TraitValueDTO> {
  return db.transaction(async (tx) => {
    const cur = await selectTraitValueDtoById(tx, args.id);
    if (!cur) throw new Error("Trait value not found.");
    if (cur.setId !== args.setId) throw new Error("Trait value set mismatch.");

    const aliasTargetId = args.aliasTargetId; // number | null | undefined

    const willBeAlias =
      aliasTargetId !== undefined
        ? aliasTargetId !== null
        : cur.aliasTarget !== null;

    // block: setting alias when this value has aliases
    if (
      aliasTargetId !== undefined &&
      aliasTargetId !== null &&
      cur.aliasCount > 0
    ) {
      throw new Error(
        `Cannot make "${cur.label}" an alias because ${cur.aliasCount} alias value(s) depend on it.`
      );
    }

    // validate target if setting alias
    if (aliasTargetId !== undefined && aliasTargetId !== null) {
      if (aliasTargetId === args.id)
        throw new Error("A trait value cannot alias itself.");

      const target = await selectTraitValueRowById(tx, aliasTargetId);
      if (!target) throw new Error("Alias target not found.");
      if (target.setId !== args.setId)
        throw new Error("Alias target must be in the same trait set.");
      if (!target.isCanonical)
        throw new Error("Alias target must be canonical.");
    }

    // if result is alias, reject attempts to set canonical-only fields
    if (willBeAlias) {
      if (args.hexCode !== undefined)
        throw new Error("Hex code can only be set for canonical values.");
      if (args.description !== undefined)
        throw new Error("Description can only be set for canonical values.");
    }

    const patch = {
      id: args.id,
      setId: args.setId,
      key: args.key?.trim(),
      label: args.label?.trim(),
      hexCode: args.hexCode === undefined ? undefined : args.hexCode,
      description:
        args.description === undefined
          ? undefined
          : (args.description?.trim() ?? ""),
      aliasTargetId,
    };

    const updated = await updateTraitValueRow(tx, patch);
    if (!updated) throw new Error("Update failed.");

    const dto = await selectTraitValueDtoById(tx, args.id);
    if (!dto) throw new Error("Updated row not found.");

    return dto;
  });
}
