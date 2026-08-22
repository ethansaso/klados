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
  selectMinimalModifierRowById,
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
}): Promise<ModifierPaginatedResult> {
  return listModifiersQuery(args);
}

/**
 * Create a modifier group.
 */
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

/**
 * Create a modifier value (canonical only; use updateModifier to set an alias).
 */
export async function createModifier(
  args: CreateModifierInput,
): Promise<ModifierDTO | null> {
  const value = args.value.trim();
  const description = args.description?.trim() ?? "";

  return db.transaction(async (tx) => {
    const dto = await insertModifier(tx, {
      groupId: args.groupId,
      value,
      description,
      affixType: args.affixType,
      canonicalValueId: null,
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
    const cur = await selectModifierDtoById(tx, args.id);
    if (!cur) throw new Error("Modifier not found.");

    const aliasTargetId = args.aliasTargetId;
    const willBeAlias =
      aliasTargetId !== undefined
        ? aliasTargetId !== null
        : cur.aliasOf !== null;

    // block: making an alias when other aliases depend on this value
    if (
      aliasTargetId !== undefined &&
      aliasTargetId !== null &&
      cur.aliasCount > 0
    ) {
      throw new Error(
        `Cannot make "${cur.value}" an alias because ${cur.aliasCount} alias value(s) depend on it.`,
      );
    }

    // validate alias target
    if (aliasTargetId !== undefined && aliasTargetId !== null) {
      if (aliasTargetId === args.id)
        throw new Error("A modifier value cannot alias itself.");
      const target = await selectMinimalModifierRowById(tx, aliasTargetId);
      if (!target) throw new Error("Alias target not found.");
      if (target.groupId !== cur.groupId)
        throw new Error("Alias target must belong to the same group.");
      if (target.canonicalValueId !== null)
        throw new Error("Alias target must be canonical.");
    }

    // block description changes when result will be an alias
    if (willBeAlias && args.description !== undefined) {
      throw new Error("Description can only be set for canonical values.");
    }

    const updated = await updateModifierRow(tx, args);
    if (!updated) throw new Error("Update failed.");

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

/**
 * List all canonical modifiers with group labels (unpaginated).
 */
export async function listAllModifiers(): Promise<
  (Pick<ModifierDTO, "id" | "value" | "affixType" | "groupId"> & {
    groupLabel: string;
  })[]
> {
  return db.transaction(async (tx) => {
    return selectAllModifiersWithGroups(tx);
  });
}
