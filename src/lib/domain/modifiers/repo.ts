import { asc, count, eq, ilike } from "drizzle-orm";
import { db } from "../../../db/client";
import {
  categoricalModifierGroup as modifierGroupTbl,
  categoricalModifierValue as modifierValueTbl,
} from "../../../db/schema/schema";
import { likeAnywhere } from "../../utils/likeAnywhere";
import { ModifierGroupPaginatedResult } from "./types";

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
      key: modifierGroupTbl.key,
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
      modifierGroupTbl.key,
      modifierGroupTbl.label,
      modifierGroupTbl.description,
      modifierGroupTbl.class,
    )
    .orderBy(asc(modifierGroupTbl.label), asc(modifierGroupTbl.key))
    .limit(pageSize)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(modifierGroupTbl)
    .where(filters);

  return { items, total, page, pageSize };
}
