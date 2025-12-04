import { db } from "../../../db/client";
import { snakeCase } from "../../utils/casing";
import {
  countCategoricalUsageForCharacter,
  deleteCharacterById,
  fetchCharacterDetailById,
  insertCategoricalMeta,
  insertCharacter,
  listCharactersQuery,
  selectCharacterGroupById,
  selectCharactersByIds,
} from "./repo";
import type {
  CategoricalCharacterDTO,
  CharacterDTO,
  CharacterDetailDTO,
  CharacterPaginatedResult,
} from "./types";

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
  ids: number[]
): Promise<CharacterDTO[]> {
  if (!ids.length) {
    return [];
  }

  const dtos = await db.transaction(async (tx) => {
    const results: CategoricalCharacterDTO[] = await selectCharactersByIds(
      tx,
      ids
    );
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
export async function createCharacter(args: {
  key: string;
  label: string;
  description?: string;
  groupId: number;
  traitSetId: number;
  isMultiSelect: boolean;
}): Promise<CharacterDTO | null> {
  const { key, label, description, groupId, traitSetId, isMultiSelect } = args;

  const normalizedKey = snakeCase(key.trim());
  const normalizedLabel = label.trim();
  const normalizedDescription = description?.trim() ?? "";

  return db.transaction(async (tx) => {
    const charRow = await insertCharacter(tx, {
      key: normalizedKey,
      label: normalizedLabel,
      description: normalizedDescription,
      groupId,
    });

    if (!charRow) {
      return null;
    }

    await insertCategoricalMeta(tx, {
      characterId: charRow.id,
      traitSetId,
      isMultiSelect,
    });

    const groupRow = await selectCharacterGroupById(tx, charRow.groupId);
    if (!groupRow) {
      return null;
    }

    const dto: CategoricalCharacterDTO = {
      id: charRow.id,
      key: charRow.key,
      label: charRow.label,
      description: charRow.description,
      group: { id: groupRow.id, label: groupRow.label },
      usageCount: 0,
      type: "categorical",
      characterId: charRow.id,
      traitSetId,
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
 * TODO: extend for numeric/range kinds when supported.
 */
export async function deleteCharacter(args: {
  id: number;
}): Promise<{ id: number } | null> {
  const { id } = args;

  return db.transaction(async (tx) => {
    const usageCount = await countCategoricalUsageForCharacter(tx, id);

    if (usageCount > 0) {
      throw new CharacterInUseError(usageCount);
    }

    const deleted = await deleteCharacterById(tx, id);
    return deleted;
  });
}
