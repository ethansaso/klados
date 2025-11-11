import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
  and,
  asc,
  count,
  countDistinct,
  eq,
  ilike,
  inArray,
  or,
  SQL,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import z from "zod";
import { db } from "../../../../db/client";
import {
  categoricalCharacterMeta as catMetaTbl,
  categoricalTraitSet as setsTbl,
  categoricalTraitValue as valsTbl,
} from "../../../../db/schema/schema";
import { requireCuratorMiddleware } from "../../../auth/serverFnMiddleware";
import { PaginationSchema } from "../../../validation/pagination";
import {
  TraitSetDetailDTO,
  TraitSetDTO,
  TraitSetPaginatedResult,
  TraitValueDTO,
} from "./types";

export const listTraitSets = createServerFn({ method: "GET" })
  .inputValidator(
    PaginationSchema.extend({
      q: z.string().optional(),
      ids: z.array(z.number()).optional(),
    })
  )
  .handler(async ({ data }): Promise<TraitSetPaginatedResult> => {
    const { q, ids, page, pageSize } = data;
    const offset = (page - 1) * pageSize;

    // Escape %, _ and \ in the search string (no user wildcards)
    const rawQ = q?.trim();
    const likeAnywhere =
      rawQ && rawQ.length
        ? `%${rawQ.replace(/([%_\\])/g, "\\$1")}%`
        : undefined;

    // Common filters (by ids and optional search on key/label)
    const filters: (SQL | undefined)[] = [
      ids && ids.length ? inArray(setsTbl.id, ids) : undefined,
      likeAnywhere
        ? or(
            ilike(setsTbl.label, likeAnywhere),
            ilike(setsTbl.key, likeAnywhere)
          )
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

    // Final select with pre-aggregated tables
    const items = await db
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
  });

export const createTraitSet = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(
    z.object({
      key: z.string().min(1).max(100),
      label: z.string().min(1).max(200),
      description: z.string().max(1000).optional(),
    })
  )
  .handler(async ({ data }): Promise<TraitSetDTO> => {
    const key = data.key.trim();
    const label = data.label.trim();
    const description = data.description?.trim() || null;

    return await db.transaction(async (tx) => {
      const [traitSet] = await tx
        .insert(setsTbl)
        .values({ key, label, description })
        .returning({
          id: setsTbl.id,
          key: setsTbl.key,
          label: setsTbl.label,
          description: setsTbl.description,
        });

      if (!traitSet) throw notFound();
      return {
        ...traitSet,
        valueCount: 0,
        canonicalCount: 0,
        usedByCharacters: 0,
      };
    });
  });

export const deleteTraitSet = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }): Promise<{ id: number }> => {
    const { id } = data;

    return await db.transaction(async (tx) => {
      const [deleted] = await tx
        .delete(setsTbl)
        .where(eq(setsTbl.id, id))
        .returning({ id: setsTbl.id });

      if (!deleted) throw notFound();
      return deleted;
    });
  });

export const getTraitSet = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }): Promise<TraitSetDetailDTO> => {
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
      .where(eq(setsTbl.id, data.id))
      .limit(1);

    const row = rows[0];
    if (!row) throw notFound();
    return row;
  });

export const listTraitSetValues = createServerFn({ method: "GET" })
  .inputValidator(z.object({ setId: z.number().int().positive() }))
  .handler(async ({ data }): Promise<TraitValueDTO[]> => {
    const v = valsTbl;
    const canon = alias(valsTbl, "canon");

    const rows = await db
      .select({
        id: v.id,
        setId: v.setId,
        key: v.key,
        label: v.label,
        isCanonical: v.isCanonical,
        canonId: canon.id,
        canonLabel: canon.label,
      })
      .from(v)
      .leftJoin(canon, eq(v.canonicalValueId, canon.id))
      .where(eq(v.setId, data.setId))
      // Alphabetically, then by ID to stabilize order
      .orderBy(asc(v.label), asc(v.id));

    return rows.map((r) => ({
      id: r.id,
      setId: r.setId,
      key: r.key,
      label: r.label,
      isCanonical: r.isCanonical,
      aliasTarget: r.isCanonical
        ? null
        : r.canonId
          ? { id: r.canonId, label: r.canonLabel! }
          : null,
    }));
  });

export const createTraitValue = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(
    z.object({
      setId: z.coerce.number().int().positive(),
      key: z.string().min(1).max(100),
      label: z.string().min(1).max(200),
      canonicalValueId: z.coerce.number().int().positive().optional(),
    })
  )
  .handler(async ({ data }): Promise<TraitValueDTO> => {
    const setId = data.setId;
    const key = data.key.trim();
    const label = data.label.trim();
    const canonicalValueId = data.canonicalValueId ?? null;

    return await db.transaction(async (tx) => {
      // If alias, verify the target exists, is in the same set, and is canonical.
      if (canonicalValueId) {
        const [target] = await tx
          .select({
            id: valsTbl.id,
            setId: valsTbl.setId,
            isCanonical: valsTbl.isCanonical,
            label: valsTbl.label,
          })
          .from(valsTbl)
          .where(eq(valsTbl.id, canonicalValueId!))
          .limit(1);

        if (!target) throw new Error("Alias target not found.");
        if (target.setId !== setId)
          throw new Error("Alias target must be in the same trait set.");
        if (!target.isCanonical)
          throw new Error("Alias target must be canonical.");
      }

      // Insert the new value
      const [inserted] = await tx
        .insert(valsTbl)
        .values({
          setId,
          key,
          label,
          isCanonical: !canonicalValueId,
          canonicalValueId,
        })
        .returning({
          id: valsTbl.id,
          setId: valsTbl.setId,
          key: valsTbl.key,
          label: valsTbl.label,
          isCanonical: valsTbl.isCanonical,
          canonicalValueId: valsTbl.canonicalValueId,
        });

      if (!inserted) throw new Error("Insert failed.");

      // Build DTO with aliasTarget (single self-join)
      const v = valsTbl;
      const canon = alias(valsTbl, "canon");

      const [row] = await tx
        .select({
          id: v.id,
          setId: v.setId,
          key: v.key,
          label: v.label,
          isCanonical: v.isCanonical,
          canonicalValueId: v.canonicalValueId,
          canonId: canon.id,
          canonLabel: canon.label,
        })
        .from(v)
        .leftJoin(canon, eq(v.canonicalValueId, canon.id))
        .where(eq(v.id, inserted.id))
        .orderBy(asc(v.id)); // stabilize

      if (!row) throw new Error("Inserted row not found.");

      const dto: TraitValueDTO = {
        id: row.id,
        setId: row.setId,
        key: row.key,
        label: row.label,
        isCanonical: row.isCanonical,
        aliasTarget: row.isCanonical
          ? null
          : row.canonId
            ? { id: row.canonId, label: row.canonLabel! }
            : null,
      };

      return dto;
    });
  });
