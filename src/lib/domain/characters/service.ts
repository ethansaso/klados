import { db } from "../../../../db/client";
import { snakeCase } from "../../utils/formatting/casing";
import { selectUnitFamilyById } from "../units/repo";
import {
  countUsageForCharacter,
  deleteCharacterById,
  fetchCharacterDetailById,
  insertCategoricalMeta,
  insertCharacter,
  insertNumericMeta,
  listCharactersQuery,
  selectCharacterGroupById,
  selectCharactersByIds,
} from "./repo";
import type {
  CategoricalCharacterDTO,
  CharacterDTO,
  CharacterDetailDTO,
  CharacterPaginatedResult,
  NumberCharacterDTO,
  RangeCharacterDTO,
} from "./types";
import type { CreateCharacterInput } from "./validation";

/**
 * Get a character by id.
 */
export async function getCharacter(args: {
  id: number;
}): Promise<CharacterDetailDTO | null> {
  return fetchCharacterDetailById(args.id);
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
 * TODO: add more than categorical
 */
export async function createCharacter(
  args: CreateCharacterInput,
): Promise<CharacterDTO | null> {
  const normalizedKey = snakeCase(args.key.trim());
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
      key: normalizedKey,
      label: normalizedLabel,
      description: normalizedDescription,
      groupId: args.groupId,
    });

    if (!charRow) return null;

    if (args.type === "categorical") {
      await insertCategoricalMeta(tx, {
        characterId: charRow.id,
        traitSetId: args.traitSetId,
        isMultiSelect: args.isMultiSelect,
      });
    } else {
      await insertNumericMeta(tx, {
        characterId: charRow.id,
        unitFamilyId: args.unitFamilyId,
        kind: args.type === "number" ? "single" : "range",
      });
    }

    const groupRow = await selectCharacterGroupById(tx, charRow.groupId);
    if (!groupRow) return null;

    if (args.type === "categorical") {
      const dto: CategoricalCharacterDTO = {
        id: charRow.id,
        key: charRow.key,
        label: charRow.label,
        description: charRow.description,
        group: { id: groupRow.id, label: groupRow.label },
        usageCount: 0,
        type: "categorical",
        characterId: charRow.id,
        traitSetId: args.traitSetId,
      };
      return dto;
    }

    if (args.type === "number") {
      const dto: NumberCharacterDTO = {
        id: charRow.id,
        key: charRow.key,
        label: charRow.label,
        description: charRow.description,
        group: { id: groupRow.id, label: groupRow.label },
        usageCount: 0,
        type: "number",
        characterId: charRow.id,
        unitFamilyId: args.unitFamilyId,
      };
      return dto;
    }

    const dto: RangeCharacterDTO = {
      id: charRow.id,
      key: charRow.key,
      label: charRow.label,
      description: charRow.description,
      group: { id: groupRow.id, label: groupRow.label },
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
