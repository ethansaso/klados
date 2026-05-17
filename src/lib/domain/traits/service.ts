import { db } from "../../../../db/client";
import {
  deleteTraitValueById,
  insertTraitValueRow,
  selectAllTraitValuesByCharacters,
  selectMinimalTraitValueRowById,
  selectTraitValueDtoById,
  selectTraitValueDtosByIds,
  selectTraitValuesByCharacterPaginated,
  updateTraitValueRow,
} from "./repo";
import type { TraitValueDTO, TraitValuePaginatedResult } from "./types";
import type { UpdateTraitValueInput } from "./validation";

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
        `Cannot delete "${dto.label}" because it is used by ${dto.usageCount} taxon character state(s).`,
      );
    }

    // Block delete if has dependent aliases
    if (!dto.aliasOf && (dto.aliasCount ?? 0) > 0) {
      throw new Error(
        `Cannot delete "${dto.label}" because ${dto.aliasCount} alias value(s) depend on it. Remove or reassign those aliases first.`,
      );
    }

    const deleted = await deleteTraitValueById(tx, id);
    return deleted;
  });
}

/**
 * Fetch a single trait value by ID.
 * Returns null if not found.
 */
export async function getTraitValue(args: {
  id: number;
}): Promise<TraitValueDTO | null> {
  return db.transaction((tx) => selectTraitValueDtoById(tx, args.id));
}

/**
 * Bulk fetch trait values by ID.
 */
export async function getTraitValuesByIds(
  ids: number[],
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
  characterId: number;
  label: string;
  canonicalValueId?: number | null;
}): Promise<TraitValueDTO> {
  const characterId = args.characterId;
  const label = args.label.trim();
  const canonicalValueId = args.canonicalValueId ?? null;

  return db.transaction(async (tx) => {
    // If alias, verify the target exists, is in the same set, and is canonical.
    if (canonicalValueId) {
      const target = await selectMinimalTraitValueRowById(tx, canonicalValueId);
      if (!target) {
        throw new Error("Alias target not found.");
      }
      if (target.characterId !== characterId) {
        throw new Error("Alias target must belong to the same character.");
      }
      if (target.canonicalValueId !== null) {
        throw new Error("Alias target must be canonical.");
      }
    }

    const inserted = await insertTraitValueRow(tx, {
      characterId,
      label,
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
  args: UpdateTraitValueInput,
): Promise<TraitValueDTO> {
  return db.transaction(async (tx) => {
    const cur = await selectTraitValueDtoById(tx, args.id);
    if (!cur) throw new Error("Trait value not found.");
    if (cur.characterId !== args.characterId)
      throw new Error("Trait value character mismatch.");

    const aliasTargetId = args.aliasTargetId; // number | null | undefined

    const willBeAlias =
      aliasTargetId !== undefined
        ? aliasTargetId !== null
        : cur.aliasOf !== null;

    // block: setting alias when this value has aliases
    if (
      aliasTargetId !== undefined &&
      aliasTargetId !== null &&
      cur.aliasCount > 0
    ) {
      throw new Error(
        `Cannot make "${cur.label}" an alias because ${cur.aliasCount} alias value(s) depend on it.`,
      );
    }

    // validate target if setting alias
    if (aliasTargetId !== undefined && aliasTargetId !== null) {
      if (aliasTargetId === args.id)
        throw new Error("A trait value cannot alias itself.");

      const target = await selectMinimalTraitValueRowById(tx, aliasTargetId);
      if (!target) throw new Error("Alias target not found.");
      if (target.characterId !== args.characterId)
        throw new Error("Alias target must belong to the same character.");
      if (target.canonicalValueId !== null)
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
      characterId: args.characterId,
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

/**
 * List trait values for a character, paginated.
 */
export async function listTraitValuesByCharacter(args: {
  characterId: number;
  page: number;
  pageSize: number;
  canonicalOnly?: boolean;
  q?: string;
}): Promise<TraitValuePaginatedResult> {
  return db.transaction(async (tx) => {
    return selectTraitValuesByCharacterPaginated(
      tx,
      args.characterId,
      args.page,
      args.pageSize,
      { canonicalOnly: args.canonicalOnly, q: args.q },
    );
  });
}

/**
 * List all canonical trait values for the given characters (unpaginated),
 * grouped by character ID.
 */
export async function listAllTraitValuesByCharacters(
  characterIds: number[],
): Promise<ReturnType<typeof selectAllTraitValuesByCharacters>> {
  return db.transaction(async (tx) => {
    return selectAllTraitValuesByCharacters(tx, characterIds);
  });
}
