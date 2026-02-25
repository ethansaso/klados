import { db } from "../../../../db/client";
import { selectUnitFamilyById } from "../units/repo";
import {
  countUsageForCharacter,
  deleteCharacterById,
  fetchCharacterDetailById,
  insertCategoricalMeta,
  insertCharacter,
  insertNumericMeta,
  listCharactersQuery,
  selectCharactersByIds,
  updateCategoricalMeta,
  updateCharacterBase,
} from "./repo";
import type {
  CategoricalCharacterDTO,
  CharacterDTO,
  CharacterDetailDTO,
  CharacterPaginatedResult,
  NumberCharacterDTO,
  RangeCharacterDTO,
} from "./types";
import type { CreateCharacterInput, UpdateCharacterInput } from "./validation";

/**
 * Get a character by id.
 */
export async function getCharacter(args: {
  id: number;
}): Promise<CharacterDetailDTO | null> {
  return fetchCharacterDetailById(db, args.id);
}

/**
 * Bulk fetch characters by ID (non-paginated).
 * Currently categorical-only, returns CharacterDTO[].
 */
export async function getCharactersByIds(
  ids: number[],
): Promise<CharacterDTO[]> {
  if (!ids.length) {
    return [];
  }

  const dtos = await db.transaction(async (tx) => {
    const results: CharacterDTO[] = await selectCharactersByIds(tx, ids);
    return results;
  });

  return dtos;
}

export async function listCharacters(args: {
  q?: string;
  ids?: number[];
  page: number;
  pageSize: number;
}): Promise<CharacterPaginatedResult> {
  return listCharactersQuery(args);
}

/**
 * Create a character.
 */
export async function createCharacter(
  args: CreateCharacterInput,
): Promise<CharacterDTO | null> {
  const normalizedLabel = args.label.trim();
  const normalizedDescription = args.description?.trim() ?? "";

  return db.transaction(async (tx) => {
    // Make sure unit family exists!
    if (args.type === "number" || args.type === "range") {
      const fam = await selectUnitFamilyById(tx, args.unitFamilyId);
      if (!fam) {
        return null;
      }
    }

    const charRow = await insertCharacter(tx, {
      label: normalizedLabel,
      description: normalizedDescription,
    });

    if (!charRow) return null;

    if (args.type === "categorical") {
      await insertCategoricalMeta(tx, {
        characterId: charRow.id,
        isMultiSelect: args.isMultiSelect,
      });
    } else {
      await insertNumericMeta(tx, {
        characterId: charRow.id,
        unitFamilyId: args.unitFamilyId,
        kind: args.type === "number" ? "single" : "range",
      });
    }

    if (args.type === "categorical") {
      const dto: CategoricalCharacterDTO = {
        id: charRow.id,
        label: charRow.label,
        features: [],
        description: charRow.description,
        usageCount: 0,
        type: "categorical",
        characterId: charRow.id,
        traitCount: 0,
      };
      return dto;
    }

    if (args.type === "number") {
      const dto: NumberCharacterDTO = {
        id: charRow.id,
        label: charRow.label,
        description: charRow.description,
        features: [],
        usageCount: 0,
        type: "number",
        characterId: charRow.id,
        unitFamilyId: args.unitFamilyId,
      };
      return dto;
    }

    const dto: RangeCharacterDTO = {
      id: charRow.id,
      label: charRow.label,
      description: charRow.description,
      features: [],
      usageCount: 0,
      type: "range",
      characterId: charRow.id,
      unitFamilyId: args.unitFamilyId,
    };
    return dto;
  });
}

export class CharacterInUseError extends Error {
  readonly usageCount: number;

  constructor(usageCount: number) {
    super(`Cannot delete character; it is in use by ${usageCount} taxa.`);
    this.name = "CharacterInUseError";
    this.usageCount = usageCount;
  }
}

/**
 * Delete a character if it is unused.
 * Returns { id } if deleted, null if the character does not exist.
 * Throws CharacterInUseError if in use.
 */
export async function deleteCharacter(args: {
  id: number;
}): Promise<{ id: number } | null> {
  const { id } = args;

  return db.transaction(async (tx) => {
    const usageCount = await countUsageForCharacter(tx, id);

    if (usageCount === null) {
      return null;
    }

    if (usageCount > 0) {
      throw new CharacterInUseError(usageCount);
    }

    const deleted = await deleteCharacterById(tx, id);
    return deleted;
  });
}

/**
 * Update a character's base fields and categorical meta.
 * Returns the refreshed CharacterDetailDTO, or null if not found.
 *
 * Throws if `isMultiSelect` is provided for a non-categorical character.
 */
export async function updateCharacter(
  args: UpdateCharacterInput,
): Promise<CharacterDetailDTO | null> {
  const { id, isMultiSelect, ...baseFields } = args;

  // Normalize the fields that were provided
  const normalized: Partial<{
    key: string;
    label: string;
    description: string;
  }> = {};
  if (baseFields.label !== undefined)
    normalized.label = baseFields.label.trim();
  if (baseFields.description !== undefined)
    normalized.description = baseFields.description.trim();

  return db.transaction(async (tx) => {
    const updated = await updateCharacterBase(tx, id, normalized);
    if (!updated) return null;

    if (isMultiSelect !== undefined) {
      const detail = await fetchCharacterDetailById(tx, id);
      if (!detail || detail.type !== "categorical") {
        throw new Error(
          `Cannot set isMultiSelect on non-categorical character ${id}.`,
        );
      }
      await updateCategoricalMeta(tx, id, isMultiSelect);
    }

    // Re-fetch the full detail DTO so the caller gets fresh data.
    return fetchCharacterDetailById(tx, id);
  });
}
