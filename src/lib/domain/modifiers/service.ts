import { db } from "../../../../db/client";
import {
  insertModifierGroup,
  listModifierGroupsQuery,
  selectModifierGroupById,
} from "./repo";
import type {
  ModifierGroupDetailDTO,
  ModifierGroupDTO,
  ModifierGroupPaginatedResult,
} from "./types";
import type { CreateModifierGroupInput } from "./validation";

export async function getModifierGroup(
  id: number,
): Promise<ModifierGroupDetailDTO | null> {
  return selectModifierGroupById(id);
}

export async function listModifierGroups(args: {
  page: number;
  pageSize: number;
  q?: string;
}): Promise<ModifierGroupPaginatedResult> {
  return listModifierGroupsQuery(args);
}

/**
 * Create a modifier group.
 */
export async function createModifierGroup(
  args: CreateModifierGroupInput,
): Promise<ModifierGroupDTO | null> {
  const key = args.key.trim();
  const label = args.label.trim();
  const description = args.description?.trim() || "";

  return db.transaction(async (tx) => {
    const dto = await insertModifierGroup(tx, {
      key,
      label,
      description,
      class: args.class,
    });

    if (!dto) {
      return null;
    }

    return dto;
  });
}
