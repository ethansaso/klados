import { and, asc, count, eq, ilike, ne, sql } from "drizzle-orm";
import { db } from "../../../../db/client";
import {
  modifierGroup as modifierGroupTbl,
  modifierValue as modifierValueTbl,
  taxonCharacterStateModifierCategorical,
  taxonCharacterStateModifierNumber,
  taxonCharacterStateModifierRange,
} from "../../../../db/schema/schema";
import { likeAnywhere } from "../../utils/sql/likeAnywhere";
import type { Transaction } from "../../utils/types/transactionType";
import { hydrateMedia } from "../media/repo";
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
  excludeId?: number;
}): Promise<ModifierPaginatedResult> {
  const { groupId, q, page, pageSize } = args;
  const offset = (page - 1) * pageSize;

  const like = likeAnywhere(q);

  const filters = and(
    groupId ? eq(modifierValueTbl.groupId, groupId) : undefined,
    like ? ilike(modifierValueTbl.label, like) : undefined,
    // Dropped before the page is sliced, so a full page still comes back
    args.excludeId ? ne(modifierValueTbl.id, args.excludeId) : undefined,
  );

  const rawItems = await db
    .select({
      id: modifierValueTbl.id,
      groupId: modifierValueTbl.groupId,
      label: modifierValueTbl.label,
      description: modifierValueTbl.description,
      affixType: modifierValueTbl.affixType,
      mediaId: modifierValueTbl.mediaId,
      usageCount: sql<number>`
        COALESCE(${modCatUsageSel.catUsageCount}, 0) +
        COALESCE(${modNumUsageSel.numUsageCount}, 0) +
        COALESCE(${modRangeUsageSel.rangeUsageCount}, 0)
      `.mapWith(Number),
    })
    .from(modifierValueTbl)
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
    .orderBy(asc(modifierValueTbl.label))
    .limit(pageSize)
    .offset(offset);

  const items = await hydrateMedia(db, rawItems);

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
    })
    .returning({
      id: modifierGroupTbl.id,
      label: modifierGroupTbl.label,
      description: modifierGroupTbl.description,
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
    label: string;
    description: string;
    affixType: "prefix" | "suffix";
    mediaId: number | null;
  },
): Promise<ModifierDTO | null> {
  const [modifier] = await tx
    .insert(modifierValueTbl)
    .values({
      groupId: args.groupId,
      label: args.label,
      description: args.description ?? "",
      affixType: args.affixType,
      mediaId: args.mediaId,
    })
    .returning({
      id: modifierValueTbl.id,
      groupId: modifierValueTbl.groupId,
      label: modifierValueTbl.label,
      description: modifierValueTbl.description,
      affixType: modifierValueTbl.affixType,
      mediaId: modifierValueTbl.mediaId,
    });

  if (!modifier) return null;

  const raw = { ...modifier, usageCount: 0 };
  const [dto] = await hydrateMedia(tx, [raw]);

  return dto ?? null;
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
 * Fetch a full ModifierDTO by id within a transaction (for post-update re-fetch).
 */
export async function selectModifierDtoById(
  tx: Transaction,
  id: number,
): Promise<ModifierDTO | null> {
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

  const v = modifierValueTbl;

  const [row] = await tx
    .select({
      id: v.id,
      groupId: v.groupId,
      label: v.label,
      description: v.description,
      affixType: v.affixType,
      mediaId: v.mediaId,
      usageCount: sql<number>`
        COALESCE(${catUsage.n}, 0) +
        COALESCE(${numUsage.n}, 0) +
        COALESCE(${rangeUsage.n}, 0)
      `.mapWith(Number),
    })
    .from(v)
    .leftJoin(catUsage, eq(catUsage.modifierId, v.id))
    .leftJoin(numUsage, eq(numUsage.modifierId, v.id))
    .leftJoin(rangeUsage, eq(rangeUsage.modifierId, v.id))
    .where(eq(v.id, id))
    .limit(1);

  if (!row) return null;

  const [dto] = await hydrateMedia(tx, [row]);

  return dto ?? null;
}

/**
 * Patch a modifier value row.
 */
export async function updateModifierRow(
  tx: Transaction,
  args: UpdateModifierInput,
): Promise<{ id: number } | null> {
  const patch: Record<string, unknown> = {};

  if (args.label !== undefined) patch.value = args.label;
  if (args.description !== undefined) patch.description = args.description;
  if (args.affixType !== undefined) patch.affixType = args.affixType;
  if (args.mediaId !== undefined) patch.mediaId = args.mediaId;

  const [updated] = await tx
    .update(modifierValueTbl)
    .set(patch)
    .where(eq(modifierValueTbl.id, args.id))
    .returning({ id: modifierValueTbl.id });

  return updated ?? null;
}

/**
 * Select all modifiers with their group labels (unpaginated).
 */
export async function selectAllModifiersWithGroups(tx: Transaction): Promise<
  (Pick<ModifierDTO, "id" | "label" | "affixType" | "groupId"> & {
    groupLabel: string;
  })[]
> {
  return tx
    .select({
      id: modifierValueTbl.id,
      label: modifierValueTbl.label,
      affixType: modifierValueTbl.affixType,
      groupId: modifierValueTbl.groupId,
      groupLabel: modifierGroupTbl.label,
    })
    .from(modifierValueTbl)
    .innerJoin(
      modifierGroupTbl,
      eq(modifierValueTbl.groupId, modifierGroupTbl.id),
    )
    .orderBy(asc(modifierGroupTbl.label), asc(modifierValueTbl.label));
}
