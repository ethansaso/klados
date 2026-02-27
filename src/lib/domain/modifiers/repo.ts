import { and, asc, count, eq, ilike, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../../../../db/client";
import {
  modifierGroup as modifierGroupTbl,
  modifierValue as modifierValueTbl,
  taxonCharacterStateModifierCategorical,
  taxonCharacterStateModifierNumber,
  taxonCharacterStateModifierRange,
} from "../../../../db/schema/schema";
import { likeAnywhere } from "../../utils/likeAnywhere";
import type { Transaction } from "../../utils/transactionType";
import { modCatUsageSel, modNumUsageSel, modRangeUsageSel } from "./selectors";
import type {
  ModifierDTO,
  ModifierGroupDetailDTO,
  ModifierGroupDTO,
  ModifierGroupPaginatedResult,
  ModifierPaginatedResult,
} from "./types";
import type {
  CreateModifierGroupInput,
  UpdateModifierInput,
} from "./validation";

export async function selectModifierGroupById(
  id: number,
): Promise<ModifierGroupDetailDTO | null> {
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

  return row ?? null;
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

export async function listModifiersQuery(args: {
  groupId?: number;
  page: number;
  pageSize: number;
  q?: string;
  canonicalOnly?: boolean;
}): Promise<ModifierPaginatedResult> {
  const { groupId, q, page, pageSize } = args;
  const offset = (page - 1) * pageSize;

  const like = likeAnywhere(q);

  const filters = and(
    groupId ? eq(modifierValueTbl.groupId, groupId) : undefined,
    like ? ilike(modifierValueTbl.value, like) : undefined,
    args.canonicalOnly ? isNull(modifierValueTbl.canonicalValueId) : undefined,
  );

  const canonAlias = alias(modifierValueTbl, "canon");

  const aliasAgg = db
    .select({
      targetId: modifierValueTbl.canonicalValueId,
      aliasCount: sql<number>`CAST(COUNT(${modifierValueTbl.id}) AS INT)`.as(
        "alias_count",
      ),
    })
    .from(modifierValueTbl)
    .groupBy(modifierValueTbl.canonicalValueId)
    .as("alias_agg");

  const rawItems = await db
    .select({
      id: modifierValueTbl.id,
      groupId: modifierValueTbl.groupId,
      value: modifierValueTbl.value,
      description: modifierValueTbl.description,
      affixType: modifierValueTbl.affixType,
      canonId: canonAlias.id,
      canonValue: canonAlias.value,
      aliasCount: sql<number>`COALESCE(${aliasAgg.aliasCount}, 0)`,
      usageCount: sql<number>`
        COALESCE(${modCatUsageSel.catUsageCount}, 0) +
        COALESCE(${modNumUsageSel.numUsageCount}, 0) +
        COALESCE(${modRangeUsageSel.rangeUsageCount}, 0)
      `.mapWith(Number),
    })
    .from(modifierValueTbl)
    .leftJoin(canonAlias, eq(modifierValueTbl.canonicalValueId, canonAlias.id))
    .leftJoin(aliasAgg, eq(aliasAgg.targetId, modifierValueTbl.id))
    .leftJoin(
      modCatUsageSel,
      eq(modCatUsageSel.modifierId, modifierValueTbl.id),
    )
    .leftJoin(
      modNumUsageSel,
      eq(modNumUsageSel.modifierId, modifierValueTbl.id),
    )
    .leftJoin(
      modRangeUsageSel,
      eq(modRangeUsageSel.modifierId, modifierValueTbl.id),
    )
    .where(filters)
    .orderBy(asc(modifierValueTbl.value))
    .limit(pageSize)
    .offset(offset);

  const items: ModifierDTO[] = rawItems.map((v) => ({
    id: v.id,
    groupId: v.groupId,
    value: v.value,
    description: v.description,
    affixType: v.affixType,
    aliasOf: v.canonId ? { id: v.canonId, value: v.canonValue! } : null,
    usageCount: v.usageCount,
    aliasCount: v.aliasCount,
  }));

  const totals = await db
    .select({ total: count() })
    .from(modifierValueTbl)
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

/**
 * Insert a modifier value row.
 */
export async function insertModifier(
  tx: Transaction,
  args: {
    groupId: number;
    value: string;
    description: string;
    affixType: "prefix" | "suffix";
    canonicalValueId: number | null;
  },
): Promise<ModifierDTO | null> {
  const canonicalValueId = args.canonicalValueId;

  const [modifier] = await tx
    .insert(modifierValueTbl)
    .values({
      groupId: args.groupId,
      value: args.value,
      description: args.description ?? "",
      affixType: args.affixType,
      canonicalValueId,
    })
    .returning({
      id: modifierValueTbl.id,
      groupId: modifierValueTbl.groupId,
      value: modifierValueTbl.value,
      description: modifierValueTbl.description,
      affixType: modifierValueTbl.affixType,
    });

  if (!modifier) return null;

  let aliasOf: { id: number; value: string } | null = null;
  if (canonicalValueId) {
    const [canon] = await tx
      .select({ id: modifierValueTbl.id, value: modifierValueTbl.value })
      .from(modifierValueTbl)
      .where(eq(modifierValueTbl.id, canonicalValueId))
      .limit(1);
    if (canon) aliasOf = { id: canon.id, value: canon.value };
  }

  return { ...modifier, aliasOf, usageCount: 0, aliasCount: 0 };
}

export async function countModifierUsages(
  tx: Transaction,
  id: number,
): Promise<number> {
  const [catCount] = await tx
    .select({ count: count() })
    .from(taxonCharacterStateModifierCategorical)
    .where(eq(taxonCharacterStateModifierCategorical.modifierId, id));
  const [numCount] = await tx
    .select({ count: count() })
    .from(taxonCharacterStateModifierNumber)
    .where(eq(taxonCharacterStateModifierNumber.modifierId, id));
  const [rangeCount] = await tx
    .select({ count: count() })
    .from(taxonCharacterStateModifierRange)
    .where(eq(taxonCharacterStateModifierRange.modifierId, id));

  return (
    (catCount?.count ?? 0) + (numCount?.count ?? 0) + (rangeCount?.count ?? 0)
  );
}

export async function deleteModifierById(
  tx: Transaction,
  id: number,
): Promise<{ id: number } | null> {
  const [deleted] = await tx
    .delete(modifierValueTbl)
    .where(eq(modifierValueTbl.id, id))
    .returning({ id: modifierValueTbl.id });

  return deleted ?? null;
}

export async function countModifierGroupUsages(
  tx: Transaction,
  id: number,
): Promise<number> {
  const [catCount] = await tx
    .select({ count: count() })
    .from(taxonCharacterStateModifierCategorical)
    .innerJoin(
      modifierValueTbl,
      eq(
        taxonCharacterStateModifierCategorical.modifierId,
        modifierValueTbl.id,
      ),
    )
    .where(eq(modifierValueTbl.groupId, id));

  const [numCount] = await tx
    .select({ count: count() })
    .from(taxonCharacterStateModifierNumber)
    .innerJoin(
      modifierValueTbl,
      eq(taxonCharacterStateModifierNumber.modifierId, modifierValueTbl.id),
    )
    .where(eq(modifierValueTbl.groupId, id));

  const [rangeCount] = await tx
    .select({ count: count() })
    .from(taxonCharacterStateModifierRange)
    .innerJoin(
      modifierValueTbl,
      eq(taxonCharacterStateModifierRange.modifierId, modifierValueTbl.id),
    )
    .where(eq(modifierValueTbl.groupId, id));

  return (
    (catCount?.count ?? 0) + (numCount?.count ?? 0) + (rangeCount?.count ?? 0)
  );
}

export async function deleteModifierGroupById(
  tx: Transaction,
  id: number,
): Promise<{ id: number } | null> {
  const [deleted] = await tx
    .delete(modifierGroupTbl)
    .where(eq(modifierGroupTbl.id, id))
    .returning({ id: modifierGroupTbl.id });

  return deleted ?? null;
}

/**
 * Fetch minimal modifier row for validation (e.g., alias target checks).
 */
export async function selectMinimalModifierRowById(
  tx: Transaction,
  id: number,
): Promise<{
  id: number;
  groupId: number;
  canonicalValueId: number | null;
  value: string;
} | null> {
  const [row] = await tx
    .select({
      id: modifierValueTbl.id,
      groupId: modifierValueTbl.groupId,
      canonicalValueId: modifierValueTbl.canonicalValueId,
      value: modifierValueTbl.value,
    })
    .from(modifierValueTbl)
    .where(eq(modifierValueTbl.id, id))
    .limit(1);

  return row ?? null;
}

/**
 * Fetch a full ModifierDTO by id within a transaction (for post-update re-fetch).
 */
export async function selectModifierDtoById(
  tx: Transaction,
  id: number,
): Promise<ModifierDTO | null> {
  const canonAlias = alias(modifierValueTbl, "canon");

  const catTbl = taxonCharacterStateModifierCategorical;
  const numTbl = taxonCharacterStateModifierNumber;
  const rangeTbl = taxonCharacterStateModifierRange;

  const catUsage = tx
    .select({
      modifierId: catTbl.modifierId,
      n: sql<number>`COUNT(*)`.as("n"),
    })
    .from(catTbl)
    .groupBy(catTbl.modifierId)
    .as("cat_usage");

  const numUsage = tx
    .select({
      modifierId: numTbl.modifierId,
      n: sql<number>`COUNT(*)`.as("n"),
    })
    .from(numTbl)
    .groupBy(numTbl.modifierId)
    .as("num_usage");

  const rangeUsage = tx
    .select({
      modifierId: rangeTbl.modifierId,
      n: sql<number>`COUNT(*)`.as("n"),
    })
    .from(rangeTbl)
    .groupBy(rangeTbl.modifierId)
    .as("range_usage");

  const aliasAgg = tx
    .select({
      targetId: modifierValueTbl.canonicalValueId,
      aliasCount: sql<number>`CAST(COUNT(${modifierValueTbl.id}) AS INT)`.as(
        "alias_count",
      ),
    })
    .from(modifierValueTbl)
    .where(eq(modifierValueTbl.canonicalValueId, id))
    .groupBy(modifierValueTbl.canonicalValueId)
    .as("alias_agg");

  const v = modifierValueTbl;

  const [row] = await tx
    .select({
      id: v.id,
      groupId: v.groupId,
      value: v.value,
      description: v.description,
      affixType: v.affixType,
      canonId: canonAlias.id,
      canonValue: canonAlias.value,
      aliasCount: sql<number>`COALESCE(${aliasAgg.aliasCount}, 0)`,
      usageCount: sql<number>`
        COALESCE(${catUsage.n}, 0) +
        COALESCE(${numUsage.n}, 0) +
        COALESCE(${rangeUsage.n}, 0)
      `.mapWith(Number),
    })
    .from(v)
    .leftJoin(canonAlias, eq(v.canonicalValueId, canonAlias.id))
    .leftJoin(aliasAgg, eq(aliasAgg.targetId, v.id))
    .leftJoin(catUsage, eq(catUsage.modifierId, v.id))
    .leftJoin(numUsage, eq(numUsage.modifierId, v.id))
    .leftJoin(rangeUsage, eq(rangeUsage.modifierId, v.id))
    .where(eq(v.id, id))
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    groupId: row.groupId,
    value: row.value,
    description: row.description,
    affixType: row.affixType,
    aliasOf: row.canonId ? { id: row.canonId, value: row.canonValue! } : null,
    usageCount: row.usageCount,
    aliasCount: row.aliasCount,
  };
}

/**
 * Patch a modifier value row.
 */
export async function updateModifierRow(
  tx: Transaction,
  args: UpdateModifierInput,
): Promise<{ id: number } | null> {
  const patch: Record<string, unknown> = {};

  if (args.value !== undefined) patch.value = args.value;
  if (args.description !== undefined) patch.description = args.description;
  if (args.affixType !== undefined) patch.affixType = args.affixType;

  if (args.aliasTargetId !== undefined) {
    if (args.aliasTargetId === null) {
      patch.canonicalValueId = null;
    } else {
      patch.canonicalValueId = args.aliasTargetId;
      patch.description = "";
    }
  }

  const [updated] = await tx
    .update(modifierValueTbl)
    .set(patch)
    .where(eq(modifierValueTbl.id, args.id))
    .returning({ id: modifierValueTbl.id });

  return updated ?? null;
}
