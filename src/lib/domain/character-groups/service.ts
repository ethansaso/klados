import { db } from "../../../db/client";
import {
  fetchCharacterGroupDetailById,
  insertCharacterGroup,
  listCharacterGroupsQuery,
  selectCharacterGroupsByIds,
} from "./repo";
import type {
  CharacterGroupDTO,
  CharacterGroupDetailDTO,
  CharacterGroupPaginatedResult,
} from "./types";

/**
 * Bulk fetch character groups by ID (non-paginated).
 */
export async function getCharacterGroupsByIds(
  ids: number[]
): Promise<CharacterGroupDTO[]> {
  if (!ids.length) {
    return [];
  }

  const dtos = await db.transaction(async (tx) => {
    return selectCharacterGroupsByIds(tx, ids);
  });

  return dtos;
}

/**
 * List character groups with optional search/ids, paginated.
 */
export async function listCharacterGroups(args: {
  q?: string;
  ids?: number[];
  page: number;
  pageSize: number;
}): Promise<CharacterGroupPaginatedResult> {
  return listCharacterGroupsQuery(args);
}

/**
 * Get a single character group detail.
 */
export async function getCharacterGroup(args: {
  id: number;
}): Promise<CharacterGroupDetailDTO | null> {
  return fetchCharacterGroupDetailById(args.id);
}

/**
 * Create a character group.
 */
export async function createCharacterGroup(args: {
  key: string;
  label: string;
  description?: string;
}): Promise<CharacterGroupDTO | null> {
  const key = args.key.trim();
  const label = args.label.trim();
  const description = args.description?.trim() || "";

  return db.transaction(async (tx) => {
    const base = await insertCharacterGroup(tx, { key, label, description });
    if (!base) {
      return null;
    }

    const dto: CharacterGroupDTO = {
      ...base,
      characterCount: 0,
    };

    return dto;
  });
}
