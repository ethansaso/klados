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
  characterCategoricalMeta as catMetaTbl,
  categoricalOptionSets as setsTbl,
  categoricalOptionValues as valsTbl,
} from "../../../../db/schema/schema";
import { requireCuratorMiddleware } from "../../../auth/serverFnMiddleware";
import {
  OptionSetDetailDTO,
  OptionSetDTO,
  OptionSetPaginatedResult,
  OptionValueDTO,
} from "./types";

export const listOptionSets = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      q: z.string().optional(),
      ids: z.array(z.number()).optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20),
    })
  )
  .handler(async ({ data }): Promise<OptionSetPaginatedResult> => {
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

    // Items with canonical value count (LEFT JOIN so empty sets still appear)
    const items = await db
      .select({
        id: setsTbl.id,
        key: setsTbl.key,
        label: setsTbl.label,
        description: setsTbl.description,
        activeValueCount: sql<number>`COUNT(${valsTbl.id}) FILTER (WHERE ${valsTbl.isCanonical})`,
      })
      .from(setsTbl)
      .leftJoin(valsTbl, eq(valsTbl.setId, setsTbl.id))
      .where(where)
      .groupBy(setsTbl.id, setsTbl.key, setsTbl.label, setsTbl.description)
      .orderBy(asc(setsTbl.key), asc(setsTbl.id))
      .limit(pageSize)
      .offset(offset);

    // Total count with the same base predicate (no join needed)
    const [{ total }] = await db
      .select({ total: count() })
      .from(setsTbl)
      .where(where);

    return { items, page, pageSize, total };
  });

export const createOptionSet = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(
    z.object({
      key: z.string().min(1).max(100),
      label: z.string().min(1).max(200),
      description: z.string().max(1000).optional(),
    })
  )
  .handler(async ({ data }): Promise<OptionSetDTO> => {
    const key = data.key.trim();
    const label = data.label.trim();
    const description = data.description?.trim() || null;

    return await db.transaction(async (tx) => {
      const [optionSet] = await tx
        .insert(setsTbl)
        .values({ key, label, description })
        .returning({
          id: setsTbl.id,
          key: setsTbl.key,
          label: setsTbl.label,
          description: setsTbl.description,
        });

      if (!optionSet) throw notFound();
      return { ...optionSet, activeValueCount: 0 };
    });
  });

export const deleteOptionSet = createServerFn({ method: "POST" })
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

export const getOptionSet = createServerFn({ method: "GET" })
  .inputValidator(
    z
      .object({
        id: z.number().int().positive().optional(),
        key: z.string().optional(),
      })
      .refine((v) => !!v.id || !!v.key, { message: "id or key required" })
  )
  .handler(async ({ data }): Promise<OptionSetDetailDTO> => {
    const where = data.id
      ? eq(setsTbl.id, data.id)
      : eq(setsTbl.key, data.key!);

    const rows = await db
      .select({
        id: setsTbl.id,
        key: setsTbl.key,
        label: setsTbl.label,
        description: setsTbl.description,
        valueCount: count(valsTbl.id),
        usedByCharacters: countDistinct(catMetaTbl.characterId),
      })
      .from(setsTbl)
      .leftJoin(valsTbl, eq(valsTbl.setId, setsTbl.id))
      .leftJoin(catMetaTbl, eq(catMetaTbl.optionSetId, setsTbl.id))
      .where(where)
      .groupBy(setsTbl.id, setsTbl.key, setsTbl.label, setsTbl.description);

    const row = rows[0];
    if (!row) throw notFound();
    return row;
  });

export const listOptionSetValues = createServerFn({ method: "GET" })
  .inputValidator(z.object({ setId: z.number().int().positive() }))
  .handler(async ({ data }): Promise<OptionValueDTO[]> => {
    const v = valsTbl;
    const canon = alias(valsTbl, "canon") as typeof valsTbl;

    const rows = await db
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
      .where(eq(v.setId, data.setId))
      // Alphabetically, then by ID to stabilize order
      .orderBy(asc(v.label), asc(v.id));

    return rows.map((r) => ({
      id: r.id,
      setId: r.setId,
      key: r.key,
      label: r.label,
      isCanonical: r.isCanonical,
      canonicalValueId: r.canonicalValueId,
      aliasTarget: r.isCanonical
        ? null
        : r.canonId
          ? { id: r.canonId, label: r.canonLabel! }
          : null,
    }));
  });
