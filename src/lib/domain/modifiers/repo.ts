import { asc, count, eq, ilike } from "drizzle-orm";
import { db } from "../../../../db/client";
import {
  categoricalModifierGroup as modifierGroupTbl,
  categoricalModifierValue as modifierValueTbl,
} from "../../../../db/schema/schema";
import { likeAnywhere } from "../../utils/likeAnywhere";
import type { Transaction } from "../../utils/transactionType";
import type {
  ModifierDTO,
  ModifierGroupDetailDTO,
  ModifierGroupDTO,
  ModifierGroupPaginatedResult,
} from "./types";
import type { CreateModifierGroupInput } from "./validation";

export async function selectModifierGroupById(
  id: number,
): Promise<ModifierGroupDetailDTO | null> {
  // Group itself
  const [row] = await db
    .select({
      id: modifierGroupTbl.id,
      label: modifierGroupTbl.label,
      description: modifierGroupTbl.description,
      class: modifierGroupTbl.class,
    })
    .from(modifierGroupTbl)
    .where(eq(modifierGroupTbl.id, id))
    .limit(1);

  if (!row) return null;

  // Modifier values within the group
  const values: ModifierDTO[] = await db
    .select({
      id: modifierValueTbl.id,
      groupId: modifierValueTbl.groupId,
      value: modifierValueTbl.value,
      description: modifierValueTbl.description,
      affixType: modifierValueTbl.affixType,
    })
    .from(modifierValueTbl)
    .where(eq(modifierValueTbl.groupId, id));

  return { ...row, values };
}

export async function listModifierGroupsQuery(args: {
  page: number;
  pageSize: number;
  q?: string;
}): Promise<ModifierGroupPaginatedResult> {
  const { q, page, pageSize } = args;
  const offset = (page - 1) * pageSize;

  const like = likeAnywhere(q);

  const filters = like ? ilike(modifierGroupTbl.label, like) : undefined;

  const items = await db
    .select({
      id: modifierGroupTbl.id,
      label: modifierGroupTbl.label,
      description: modifierGroupTbl.description,
      class: modifierGroupTbl.class,
      valueCount: count(modifierValueTbl.id),
    })
    .from(modifierGroupTbl)
    .leftJoin(
      modifierValueTbl,
      eq(modifierValueTbl.groupId, modifierGroupTbl.id),
    )
    .where(filters)
    .groupBy(
      modifierGroupTbl.id,
      modifierGroupTbl.label,
      modifierGroupTbl.description,
      modifierGroupTbl.class,
    )
    .orderBy(asc(modifierGroupTbl.label))
    .limit(pageSize)
    .offset(offset);

  const totals = await db
    .select({ total: count() })
    .from(modifierGroupTbl)
    .where(filters);
  const total = totals[0]?.total ?? 0;

  return { items, total, page, pageSize };
}

/**
 * Insert a modifier group row.
 */
export async function insertModifierGroup(
  tx: Transaction,
  args: CreateModifierGroupInput,
): Promise<ModifierGroupDTO | null> {
  const [group] = await tx
    .insert(modifierGroupTbl)
    .values({
      label: args.label,
      description: args.description,
      class: args.class,
    })
    .returning({
      id: modifierGroupTbl.id,
      label: modifierGroupTbl.label,
      description: modifierGroupTbl.description,
      class: modifierGroupTbl.class,
    });

  if (!group) return null;

  return { ...group, valueCount: 0 };
}
