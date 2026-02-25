import { and, asc, count, eq, ilike, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import {
  taxonCharacterStateCategorical as tcsTbl,
  categoricalTraitValue as valsTbl,
} from "../../../../db/schema/schema";
import type { Transaction } from "../../utils/transactionType";
import type {
  TraitValueDTO,
  TraitValuePaginatedResult,
  TraitValueRow,
} from "./types";

/**
 * Delete a trait value by id; returns the deleted id or null if nothing deleted.
 */
export async function deleteTraitValueById(
  tx: Transaction,
  id: number,
): Promise<{ id: number } | null> {
  const [deleted] = await tx
    .delete(valsTbl)
    .where(eq(valsTbl.id, id))
    .returning({ id: valsTbl.id });

  return deleted ?? null;
}

/**
 * Fetch a raw trait value row by id (e.g. for validation).
 */
export async function selectMinimalTraitValueRowById(
  tx: Transaction,
  id: number,
): Promise<Pick<
  TraitValueRow,
  "id" | "characterId" | "isCanonical" | "label"
> | null> {
  const [row] = await tx
    .select({
      id: valsTbl.id,
      characterId: valsTbl.characterId,
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
    characterId: number;
    label: string;
    isCanonical: boolean;
    canonicalValueId: number | null;
  },
): Promise<TraitValueRow | null> {
  const [inserted] = await tx
    .insert(valsTbl)
    .values({
      characterId: args.characterId,
      label: args.label,
      isCanonical: args.isCanonical,
      canonicalValueId: args.canonicalValueId,
    })
    .returning({
      id: valsTbl.id,
      characterId: valsTbl.characterId,
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
  id: number,
): Promise<TraitValueDTO | null> {
  const v = valsTbl;
  const canon = alias(valsTbl, "canon");

  const usageAgg = tx
    .select({
      traitValueId: tcsTbl.traitValueId,
      usageCount: sql<number>`CAST(COUNT(${tcsTbl.id}) AS INT)`.as(
        "usage_count",
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
        "alias_count",
      ),
    })
    .from(valsTbl)
    .where(eq(valsTbl.canonicalValueId, id))
    .groupBy(valsTbl.canonicalValueId)
    .as("alias_agg");

  const [row] = await tx
    .select({
      id: v.id,
      characterId: v.characterId,
      label: v.label,
      hexCode: v.hexCode,
      description: v.description,
      isCanonical: v.isCanonical,
      canonId: canon.id,
      canonLabel: canon.label,
      canonHexCode: canon.hexCode,
      canonDescription: canon.description,
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
    characterId: row.characterId,
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
            description: row.canonDescription!,
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
  ids: number[],
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
        "usage_count",
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
        "alias_count",
      ),
    })
    .from(valsTbl)
    .where(inArray(valsTbl.canonicalValueId, ids))
    .groupBy(valsTbl.canonicalValueId)
    .as("alias_agg");

  const rows = await tx
    .select({
      id: v.id,
      characterId: v.characterId,
      label: v.label,
      hexCode: v.hexCode,
      description: v.description,
      isCanonical: v.isCanonical,
      canonId: canon.id,
      canonLabel: canon.label,
      canonHexCode: canon.hexCode,
      canonDescription: canon.description,
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
    characterId: row.characterId,
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
            description: row.canonDescription!,
            hexCode: row.canonHexCode ?? undefined,
          }
        : null,
  }));
}

export async function updateTraitValueRow(
  tx: Transaction,
  args: {
    id: number;
    characterId: number;

    key?: string;
    label?: string;
    hexCode?: string | null;
    description?: string;
    aliasTargetId?: number | null;
  },
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
    .where(
      and(eq(valsTbl.id, args.id), eq(valsTbl.characterId, args.characterId)),
    )
    .returning({ id: valsTbl.id });

  return updated ?? null;
}

/**
 * Fetch paginated TraitValueDTOs for a given character.
 */
export async function selectTraitValuesByCharacterPaginated(
  tx: Transaction,
  characterId: number,
  page: number,
  pageSize: number,
  opts?: { canonicalOnly?: boolean; q?: string },
): Promise<TraitValuePaginatedResult> {
  const offset = (page - 1) * pageSize;

  const v = valsTbl;
  const canon = alias(valsTbl, "canon");

  const filters: ReturnType<typeof eq>[] = [eq(v.characterId, characterId)];
  if (opts?.canonicalOnly) {
    filters.push(eq(v.isCanonical, true));
  }
  if (opts?.q) {
    filters.push(ilike(v.label, `%${opts.q}%`));
  }
  const where = and(...filters)!;

  const usageAgg = tx
    .select({
      traitValueId: tcsTbl.traitValueId,
      usageCount: sql<number>`CAST(COUNT(${tcsTbl.id}) AS INT)`.as(
        "usage_count",
      ),
    })
    .from(tcsTbl)
    .groupBy(tcsTbl.traitValueId)
    .as("usage_agg");

  const aliasAgg = tx
    .select({
      targetId: valsTbl.canonicalValueId,
      aliasCount: sql<number>`CAST(COUNT(${valsTbl.id}) AS INT)`.as(
        "alias_count",
      ),
    })
    .from(valsTbl)
    .groupBy(valsTbl.canonicalValueId)
    .as("alias_agg");

  const rows = await tx
    .select({
      id: v.id,
      characterId: v.characterId,
      label: v.label,
      hexCode: v.hexCode,
      description: v.description,
      isCanonical: v.isCanonical,
      canonId: canon.id,
      canonLabel: canon.label,
      canonHexCode: canon.hexCode,
      canonDescription: canon.description,
      usageCount: sql<number>`COALESCE(${usageAgg.usageCount}, 0)`,
      aliasCount: sql<number>`COALESCE(${aliasAgg.aliasCount}, 0)`,
    })
    .from(v)
    .leftJoin(canon, eq(v.canonicalValueId, canon.id))
    .leftJoin(usageAgg, eq(usageAgg.traitValueId, v.id))
    .leftJoin(aliasAgg, eq(aliasAgg.targetId, v.id))
    .where(where)
    .orderBy(asc(v.label), asc(v.id))
    .limit(pageSize)
    .offset(offset);

  const [totals] = await tx.select({ total: count() }).from(v).where(where);

  const total = totals?.total ?? 0;

  const items: TraitValueDTO[] = rows.map((row) => ({
    id: row.id,
    characterId: row.characterId,
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
            description: row.canonDescription!,
            hexCode: row.canonHexCode ?? undefined,
          }
        : null,
  }));

  return { items, page, pageSize, total };
}
