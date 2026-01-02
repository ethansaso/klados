import {
  and,
  asc,
  count,
  countDistinct,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "../../../db/client";
import {
  categoricalCharacterMeta as catMetaTbl,
  categoricalTraitSet as setsTbl,
  taxonCharacterStateCategorical as tcsTbl,
  categoricalTraitValue as valsTbl,
} from "../../../db/schema/schema";
import { Transaction } from "../../utils/transactionType";
import type {
  TraitSetDTO,
  TraitSetDetailDTO,
  TraitSetPaginatedResult,
  TraitValueDTO,
  TraitValuePaginatedResult,
  TraitValueRow,
} from "./types";

/**
 * List trait sets with optional search and ids, paginated.
 */
export async function listTraitSetsQuery(args: {
  q?: string;
  ids?: number[];
  page: number;
  pageSize: number;
}): Promise<TraitSetPaginatedResult> {
  const { q, ids, page, pageSize } = args;
  const offset = (page - 1) * pageSize;

  const rawQ = q?.trim();
  const likeAnywhere =
    rawQ && rawQ.length ? `%${rawQ.replace(/([%_\\])/g, "\\$1")}%` : undefined;

  const filters: (SQL | undefined)[] = [
    ids && ids.length ? inArray(setsTbl.id, ids) : undefined,
    likeAnywhere
      ? or(ilike(setsTbl.label, likeAnywhere), ilike(setsTbl.key, likeAnywhere))
      : undefined,
  ];
  const where = and(...(filters.filter(Boolean) as SQL[]));

  // Aggregate values per set (isolated from character-meta)
  const valAgg = db
    .select({
      setId: valsTbl.setId,
      valueCount: count(valsTbl.id).as("value_count"),
      canonicalCount:
        sql<number>`COUNT(*) FILTER (WHERE ${valsTbl.isCanonical})`.as(
          "canonical_count"
        ),
    })
    .from(valsTbl)
    .groupBy(valsTbl.setId)
    .as("val_agg");

  // Aggregate character usage per set (isolated from values)
  const usageAgg = db
    .select({
      setId: catMetaTbl.traitSetId,
      usedByCharacters: countDistinct(catMetaTbl.characterId).as(
        "used_by_characters"
      ),
    })
    .from(catMetaTbl)
    .groupBy(catMetaTbl.traitSetId)
    .as("usage_agg");

  const items: TraitSetDTO[] = await db
    .select({
      id: setsTbl.id,
      key: setsTbl.key,
      label: setsTbl.label,
      description: setsTbl.description,
      valueCount: sql<number>`COALESCE(${valAgg.valueCount}, 0)`,
      canonicalCount: sql<number>`COALESCE(${valAgg.canonicalCount}, 0)`,
      usedByCharacters: sql<number>`COALESCE(${usageAgg.usedByCharacters}, 0)`,
    })
    .from(setsTbl)
    .leftJoin(valAgg, eq(valAgg.setId, setsTbl.id))
    .leftJoin(usageAgg, eq(usageAgg.setId, setsTbl.id))
    .where(where)
    .orderBy(asc(setsTbl.key), asc(setsTbl.id))
    .limit(pageSize)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(setsTbl)
    .where(where);

  return { items, page, pageSize, total };
}

/**
 * Insert a trait set row (no aggregates).
 */
export async function insertTraitSet(
  tx: Transaction,
  args: { key: string; label: string; description: string }
): Promise<Pick<TraitSetDTO, "id" | "key" | "label" | "description"> | null> {
  const [row] = await tx
    .insert(setsTbl)
    .values({
      key: args.key,
      label: args.label,
      description: args.description,
    })
    .returning({
      id: setsTbl.id,
      key: setsTbl.key,
      label: setsTbl.label,
      description: setsTbl.description,
    });

  return row ?? null;
}

/**
 * Delete a trait set by id; returns the deleted id or null if nothing deleted.
 */
export async function deleteTraitSetById(
  tx: Transaction,
  id: number
): Promise<{ id: number } | null> {
  const [deleted] = await tx
    .delete(setsTbl)
    .where(eq(setsTbl.id, id))
    .returning({ id: setsTbl.id });

  return deleted ?? null;
}

/**
 * Delete a trait value by id; returns the deleted id or null if nothing deleted.
 */
export async function deleteTraitValueById(
  tx: Transaction,
  id: number
): Promise<{ id: number } | null> {
  const [deleted] = await tx
    .delete(valsTbl)
    .where(eq(valsTbl.id, id))
    .returning({ id: valsTbl.id });

  return deleted ?? null;
}

/**
 * Fetch a single trait set detail by id (with aggregates).
 */
export async function fetchTraitSetDetailById(
  id: number
): Promise<TraitSetDetailDTO | null> {
  const valAgg = db
    .select({
      setId: valsTbl.setId,
      valueCount: count(valsTbl.id).as("value_count"),
      canonicalCount:
        sql<number>`COUNT(*) FILTER (WHERE ${valsTbl.isCanonical})`.as(
          "canonical_count"
        ),
    })
    .from(valsTbl)
    .groupBy(valsTbl.setId)
    .as("val_agg");

  const usageAgg = db
    .select({
      setId: catMetaTbl.traitSetId,
      usedByCharacters: countDistinct(catMetaTbl.characterId).as(
        "used_by_characters"
      ),
    })
    .from(catMetaTbl)
    .groupBy(catMetaTbl.traitSetId)
    .as("usage_agg");

  const rows = await db
    .select({
      id: setsTbl.id,
      key: setsTbl.key,
      label: setsTbl.label,
      description: setsTbl.description,
      valueCount: sql<number>`COALESCE(${valAgg.valueCount}, 0)`,
      canonicalCount: sql<number>`COALESCE(${valAgg.canonicalCount}, 0)`,
      usedByCharacters: sql<number>`COALESCE(${usageAgg.usedByCharacters}, 0)`,
    })
    .from(setsTbl)
    .leftJoin(valAgg, eq(valAgg.setId, setsTbl.id))
    .leftJoin(usageAgg, eq(usageAgg.setId, setsTbl.id))
    .where(eq(setsTbl.id, id))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Get all values for a trait set.
 */
export async function getTraitSetValuesQuery(
  setId: number
): Promise<TraitValueDTO[]> {
  const v = valsTbl;
  const canon = alias(valsTbl, "canon");

  const usageAgg = db
    .select({
      traitValueId: tcsTbl.traitValueId,
      usageCount: sql<number>`CAST(COUNT(${tcsTbl.id}) AS INT)`.as(
        "usage_count"
      ),
    })
    .from(tcsTbl)
    .innerJoin(v, eq(tcsTbl.traitValueId, v.id))
    .where(eq(v.setId, setId))
    .groupBy(tcsTbl.traitValueId)
    .as("usage_agg");

  const aliasAgg = db
    .select({
      targetId: valsTbl.canonicalValueId,
      aliasCount: sql<number>`CAST(COUNT(${valsTbl.id}) AS INT)`.as(
        "alias_count"
      ),
    })
    .from(valsTbl)
    .where(
      and(
        eq(valsTbl.setId, setId),
        sql`${valsTbl.canonicalValueId} IS NOT NULL`
      )
    )
    .groupBy(valsTbl.canonicalValueId)
    .as("alias_agg");

  const rows = await db
    .select({
      id: v.id,
      setId: v.setId,
      key: v.key,
      label: v.label,
      hexCode: v.hexCode,
      description: v.description,
      isCanonical: v.isCanonical,
      canonId: canon.id,
      canonLabel: canon.label,
      canonHexCode: canon.hexCode,
      usageCount: sql<number>`COALESCE(${usageAgg.usageCount}, 0)`,
      aliasCount: sql<number>`COALESCE(${aliasAgg.aliasCount}, 0)`,
    })
    .from(v)
    .leftJoin(canon, eq(v.canonicalValueId, canon.id))
    .leftJoin(usageAgg, eq(usageAgg.traitValueId, v.id))
    .leftJoin(aliasAgg, eq(aliasAgg.targetId, v.id))
    .where(eq(v.setId, setId))
    .orderBy(asc(v.label), asc(v.id));

  return rows.map((r) => ({
    id: r.id,
    setId: r.setId,
    key: r.key,
    label: r.label,
    hexCode: r.hexCode,
    description: r.description,
    usageCount: r.usageCount,
    aliasCount: r.aliasCount,
    aliasTarget: r.isCanonical
      ? null
      : r.canonId
        ? {
            id: r.canonId,
            canonicalId: r.canonId,
            label: r.canonLabel!,
            hexCode: r.canonHexCode ?? undefined,
          }
        : null,
  }));
}

/**
 * List paginated values for a trait set.
 */
export async function listTraitSetValuesQuery(args: {
  setId: number;
  page: number;
  pageSize: number;
  kind?: "canonical" | "alias";
  q?: string;
}): Promise<TraitValuePaginatedResult> {
  const { setId, page, pageSize, kind, q } = args;
  const offset = (page - 1) * pageSize;

  const v = valsTbl;
  const canon = alias(valsTbl, "canon");

  const usageAgg = db
    .select({
      traitValueId: tcsTbl.traitValueId,
      usageCount: sql<number>`CAST(COUNT(${tcsTbl.id}) AS INT)`.as(
        "usage_count"
      ),
    })
    .from(tcsTbl)
    .innerJoin(v, eq(tcsTbl.traitValueId, v.id))
    .where(eq(v.setId, setId))
    .groupBy(tcsTbl.traitValueId)
    .as("usage_agg");

  const aliasAgg = db
    .select({
      targetId: valsTbl.canonicalValueId,
      aliasCount: sql<number>`CAST(COUNT(${valsTbl.id}) AS INT)`.as(
        "alias_count"
      ),
    })
    .from(valsTbl)
    .where(
      and(
        eq(valsTbl.setId, setId),
        sql`${valsTbl.canonicalValueId} IS NOT NULL`
      )
    )
    .groupBy(valsTbl.canonicalValueId)
    .as("alias_agg");

  const kindFilter =
    kind === "canonical"
      ? isNull(v.canonicalValueId)
      : kind === "alias"
        ? isNotNull(v.canonicalValueId)
        : undefined;

  const qTrimmed = q?.trim();
  const qFilter =
    qTrimmed && qTrimmed.length > 0
      ? or(ilike(v.label, `%${qTrimmed}%`), ilike(v.key, `%${qTrimmed}%`))
      : undefined;

  const whereClause = and(
    eq(v.setId, setId),
    ...(kindFilter ? [kindFilter] : []),
    ...(qFilter ? [qFilter] : [])
  );

  const items = await db
    .select({
      id: v.id,
      setId: v.setId,
      key: v.key,
      label: v.label,
      hexCode: v.hexCode,
      description: v.description,
      isCanonical: v.isCanonical,
      canonId: canon.id,
      canonLabel: canon.label,
      canonHexCode: canon.hexCode,
      usageCount: sql<number>`COALESCE(${usageAgg.usageCount}, 0)`,
      aliasCount: sql<number>`COALESCE(${aliasAgg.aliasCount}, 0)`,
    })
    .from(v)
    .leftJoin(canon, eq(v.canonicalValueId, canon.id))
    .leftJoin(usageAgg, eq(usageAgg.traitValueId, v.id))
    .leftJoin(aliasAgg, eq(aliasAgg.targetId, v.id))
    .where(whereClause)
    .orderBy(asc(v.label), asc(v.id))
    .limit(pageSize)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(v)
    .where(whereClause);

  const dtos: TraitValueDTO[] = items.map((r) => ({
    id: r.id,
    setId: r.setId,
    key: r.key,
    label: r.label,
    hexCode: r.hexCode,
    description: r.description,
    usageCount: r.usageCount,
    aliasCount: r.aliasCount,
    aliasTarget: r.isCanonical
      ? null
      : r.canonId
        ? {
            id: r.canonId,
            canonicalId: r.canonId,
            label: r.canonLabel!,
            hexCode: r.canonHexCode ?? undefined,
          }
        : null,
  }));

  return { items: dtos, page, pageSize, total };
}

/**
 * Fetch a raw trait value row by id (for validation).
 */
export async function selectTraitValueRowById(
  tx: Transaction,
  id: number
): Promise<Pick<
  TraitValueRow,
  "id" | "setId" | "isCanonical" | "label"
> | null> {
  const [row] = await tx
    .select({
      id: valsTbl.id,
      setId: valsTbl.setId,
      isCanonical: valsTbl.isCanonical,
      label: valsTbl.label,
    })
    .from(valsTbl)
    .where(eq(valsTbl.id, id))
    .limit(1);

  return row ?? null;
}

/**
 * Insert a trait value row.
 */
export async function insertTraitValueRow(
  tx: Transaction,
  args: {
    setId: number;
    key: string;
    label: string;
    isCanonical: boolean;
    canonicalValueId: number | null;
  }
): Promise<TraitValueRow | null> {
  const [inserted] = await tx
    .insert(valsTbl)
    .values({
      setId: args.setId,
      key: args.key,
      label: args.label,
      isCanonical: args.isCanonical,
      canonicalValueId: args.canonicalValueId,
    })
    .returning({
      id: valsTbl.id,
      setId: valsTbl.setId,
      key: valsTbl.key,
      label: valsTbl.label,
      isCanonical: valsTbl.isCanonical,
      canonicalValueId: valsTbl.canonicalValueId,
    });

  return (inserted as TraitValueRow | undefined) ?? null;
}

/**
 * Fetch a TraitValueDTO by id.
 */
export async function selectTraitValueDtoById(
  tx: Transaction,
  id: number
): Promise<TraitValueDTO | null> {
  const v = valsTbl;
  const canon = alias(valsTbl, "canon");

  const usageAgg = tx
    .select({
      traitValueId: tcsTbl.traitValueId,
      usageCount: sql<number>`CAST(COUNT(${tcsTbl.id}) AS INT)`.as(
        "usage_count"
      ),
    })
    .from(tcsTbl)
    .where(eq(tcsTbl.traitValueId, id))
    .groupBy(tcsTbl.traitValueId)
    .as("usage_agg");

  const aliasAgg = tx
    .select({
      targetId: valsTbl.canonicalValueId,
      aliasCount: sql<number>`CAST(COUNT(${valsTbl.id}) AS INT)`.as(
        "alias_count"
      ),
    })
    .from(valsTbl)
    .where(
      and(
        eq(valsTbl.canonicalValueId, id),
        sql`${valsTbl.canonicalValueId} IS NOT NULL`
      )
    )
    .groupBy(valsTbl.canonicalValueId)
    .as("alias_agg");

  const [row] = await tx
    .select({
      id: v.id,
      setId: v.setId,
      key: v.key,
      label: v.label,
      hexCode: v.hexCode,
      description: v.description,
      isCanonical: v.isCanonical,
      canonId: canon.id,
      canonLabel: canon.label,
      canonHexCode: canon.hexCode,
      usageCount: sql<number>`COALESCE(${usageAgg.usageCount}, 0)`,
      aliasCount: sql<number>`COALESCE(${aliasAgg.aliasCount}, 0)`,
    })
    .from(v)
    .leftJoin(canon, eq(v.canonicalValueId, canon.id))
    .leftJoin(usageAgg, eq(usageAgg.traitValueId, v.id))
    .leftJoin(aliasAgg, eq(aliasAgg.targetId, v.id))
    .where(eq(v.id, id))
    .orderBy(asc(v.id))
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    setId: row.setId,
    key: row.key,
    label: row.label,
    hexCode: row.hexCode,
    description: row.description,
    usageCount: row.usageCount,
    aliasCount: row.aliasCount,
    aliasTarget: row.isCanonical
      ? null
      : row.canonId
        ? {
            id: row.canonId,
            canonicalId: row.canonId,
            label: row.canonLabel!,
            hexCode: row.canonHexCode ?? undefined,
          }
        : null,
  };
}

/**
 * Fetch multiple TraitValueDTOs by IDs.
 */
export async function selectTraitValueDtosByIds(
  tx: Transaction,
  ids: number[]
): Promise<TraitValueDTO[]> {
  if (!ids.length) {
    return [];
  }

  const v = valsTbl;
  const canon = alias(valsTbl, "canon");

  const usageAgg = tx
    .select({
      traitValueId: tcsTbl.traitValueId,
      usageCount: sql<number>`CAST(COUNT(${tcsTbl.id}) AS INT)`.as(
        "usage_count"
      ),
    })
    .from(tcsTbl)
    .where(inArray(tcsTbl.traitValueId, ids))
    .groupBy(tcsTbl.traitValueId)
    .as("usage_agg");

  const aliasAgg = tx
    .select({
      targetId: valsTbl.canonicalValueId,
      aliasCount: sql<number>`CAST(COUNT(${valsTbl.id}) AS INT)`.as(
        "alias_count"
      ),
    })
    .from(valsTbl)
    .where(
      and(
        inArray(valsTbl.canonicalValueId, ids),
        sql`${valsTbl.canonicalValueId} IS NOT NULL`
      )
    )
    .groupBy(valsTbl.canonicalValueId)
    .as("alias_agg");

  const rows = await tx
    .select({
      id: v.id,
      setId: v.setId,
      key: v.key,
      label: v.label,
      hexCode: v.hexCode,
      description: v.description,
      isCanonical: v.isCanonical,
      canonId: canon.id,
      canonLabel: canon.label,
      canonHexCode: canon.hexCode,
      usageCount: sql<number>`COALESCE(${usageAgg.usageCount}, 0)`,
      aliasCount: sql<number>`COALESCE(${aliasAgg.aliasCount}, 0)`,
    })
    .from(v)
    .leftJoin(canon, eq(v.canonicalValueId, canon.id))
    .leftJoin(usageAgg, eq(usageAgg.traitValueId, v.id))
    .leftJoin(aliasAgg, eq(aliasAgg.targetId, v.id))
    .where(inArray(v.id, ids))
    .orderBy(asc(v.id));

  return rows.map((row) => ({
    id: row.id,
    setId: row.setId,
    key: row.key,
    label: row.label,
    hexCode: row.hexCode,
    description: row.description,
    usageCount: row.usageCount,
    aliasCount: row.aliasCount,
    aliasTarget: row.isCanonical
      ? null
      : row.canonId
        ? {
            id: row.canonId,
            canonicalId: row.canonId,
            label: row.canonLabel!,
            hexCode: row.canonHexCode ?? undefined,
          }
        : null,
  }));
}

export async function updateTraitValueRow(
  tx: Transaction,
  args: {
    id: number;
    setId: number;

    key?: string;
    label?: string;
    hexCode?: string | null;
    description?: string;
    aliasTargetId?: number | null;
  }
): Promise<{ id: number } | null> {
  const patch: Record<string, unknown> = {};

  if (args.key !== undefined) patch.key = args.key;
  if (args.label !== undefined) patch.label = args.label;
  if (args.hexCode !== undefined) patch.hexCode = args.hexCode;
  if (args.description !== undefined) patch.description = args.description;

  if (args.aliasTargetId !== undefined) {
    if (args.aliasTargetId === null) {
      patch.isCanonical = true;
      patch.canonicalValueId = null;
    } else {
      patch.isCanonical = false;
      patch.canonicalValueId = args.aliasTargetId;
      patch.hexCode = null;
      patch.description = "";
    }
  }

  const [updated] = await tx
    .update(valsTbl)
    .set(patch)
    .where(and(eq(valsTbl.id, args.id), eq(valsTbl.setId, args.setId)))
    .returning({ id: valsTbl.id });

  return updated ?? null;
}
