import { db } from "../../../../db/client";
import { InUseError } from "../../utils/InUseError";
import {
  countModifierGroupUsages,
  countModifierUsages,
  deleteModifierById,
  deleteModifierGroupById,
  insertModifier,
  insertModifierGroup,
  listModifierGroupsQuery,
  listModifiersQuery,
  selectAllModifiersWithGroups,
  selectModifierDtoById,
  selectModifierGroupById,
  updateModifierRow,
} from "./repo";
import type {
  ModifierDTO,
  ModifierGroupDetailDTO,
  ModifierGroupDTO,
  ModifierGroupPaginatedResult,
  ModifierPaginatedResult,
} from "./types";
import type {
  CreateModifierGroupInput,
  CreateModifierInput,
  UpdateModifierInput,
} from "./validation";

export async function getModifierGroup(
  id: number,
): Promise<ModifierGroupDetailDTO | null> {
  return selectModifierGroupById(id);
}

export async function getModifier(id: number): Promise<ModifierDTO | null> {
  return db.transaction((tx) => selectModifierDtoById(tx, id));
}

export async function listModifierGroups(args: {
  page: number;
  pageSize: number;
  q?: string;
}): Promise<ModifierGroupPaginatedResult> {
  return listModifierGroupsQuery(args);
}

export async function listModifiers(args: {
  groupId?: number;
  page: number;
  pageSize: number;
  q?: string;
  excludeId?: number;
}): Promise<ModifierPaginatedResult> {
  return listModifiersQuery(args);
}

export async function createModifierGroup(
  args: CreateModifierGroupInput,
): Promise<ModifierGroupDTO | null> {
  const label = args.label.trim();
  const description = args.description?.trim() || "";

  return db.transaction(async (tx) => {
    const dto = await insertModifierGroup(tx, {
      label,
      description,
    });

    if (!dto) {
      return null;
    }

    return dto;
  });
}

export async function createModifier(
  args: CreateModifierInput,
): Promise<ModifierDTO | null> {
  const label = args.label.trim();
  const description = args.description?.trim() ?? "";

  return db.transaction(async (tx) => {
    const dto = await insertModifier(tx, {
      groupId: args.groupId,
      label,
      description,
      affixType: args.affixType,
      mediaId: args.mediaId ?? null,
    });

    return dto;
  });
}

export async function deleteModifier(
  id: number,
): Promise<{ id: number } | null> {
  return db.transaction(async (tx) => {
    const usageCount = await countModifierUsages(tx, id);

    if (usageCount > 0) {
      throw new InUseError("modifier", usageCount);
    }

    const deleted = await deleteModifierById(tx, id);
    return deleted;
  });
}

export async function updateModifier(
  args: UpdateModifierInput,
): Promise<ModifierDTO> {
  return db.transaction(async (tx) => {
    const updated = await updateModifierRow(tx, args);
    if (!updated) throw new Error("Modifier not found.");

    const dto = await selectModifierDtoById(tx, args.id);
    if (!dto) throw new Error("Updated modifier not found.");

    return dto;
  });
}

export async function deleteModifierGroup(
  id: number,
): Promise<{ id: number } | null> {
  return db.transaction(async (tx) => {
    const usageCount = await countModifierGroupUsages(tx, id);

    if (usageCount > 0) {
      throw new InUseError("modifier group", usageCount);
    }

    const deleted = await deleteModifierGroupById(tx, id);
    return deleted;
  });
}

/** List all modifiers with group labels (unpaginated). */
export async function listAllModifiers(): Promise<
  (Pick<ModifierDTO, "id" | "label" | "affixType" | "groupId"> & {
    groupLabel: string;
  })[]
> {
  return db.transaction(async (tx) => {
    return selectAllModifiersWithGroups(tx);
  });
}
