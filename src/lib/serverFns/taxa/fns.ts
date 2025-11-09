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
  sql,
  SQL,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import { db } from "../../../db/client";
import { names as namesTbl } from "../../../db/schema/taxa/names";
import {
  taxa as taxaTbl,
  TAXON_RANKS_DESCENDING,
} from "../../../db/schema/taxa/taxa";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { assertHierarchyInvariant } from "../../utils/assertHierarchyInvariant";
import { PaginationSchema } from "../../validation/pagination";
import { TaxonDTO, TaxonPaginatedResult } from "./types";
import {
  assertExactlyOneAcceptedScientificName,
  getChildCount,
  getCurrentTaxonMinimal,
} from "./utils";
import { taxonPatchSchema } from "./validation";

const sci = alias(namesTbl, "sci");
const sciJoinPred = and(
  eq(sci.taxonId, taxaTbl.id),
  sql`${sci.kind} = 'scientific' AND ${sci.synonymKind} IS NULL`
);

// Reusable selection shape for a TaxonDTO
const selectTaxonDTO = {
  id: taxaTbl.id,
  parentId: taxaTbl.parentId,
  rank: taxaTbl.rank,
  sourceGbifId: taxaTbl.sourceGbifId,
  sourceInatId: taxaTbl.sourceInatId,
  status: taxaTbl.status,
  media: taxaTbl.media,
  notes: taxaTbl.notes,
  acceptedName: sci.value,
  activeChildCount: sql<number>`(
    SELECT COUNT(*) FROM ${taxaTbl} AS c
    WHERE c.parent_id = ${taxaTbl.id} AND c.status = 'active'
  )`,
};

export const listTaxa = createServerFn({ method: "GET" })
  .inputValidator(
    PaginationSchema.extend({
      q: z.string().optional(),
      status: z.enum(["active", "draft", "deprecated"]).optional(),
      ids: z.array(z.number()).optional(),
    })
  )
  .handler(async ({ data }): Promise<TaxonPaginatedResult> => {
    const { q, ids, page, pageSize, status } = data;
    const offset = (page - 1) * pageSize;

    // Escape %, _ and \ in the search string (no user wildcards)
    const rawQ = q?.trim();
    const likeAnywhere =
      rawQ && rawQ.length
        ? `%${rawQ.replace(/([%_\\])/g, "\\$1")}%`
        : undefined;

    // Aliases: one for filtering (any name), one for the accepted scientific name
    const searchNames = alias(namesTbl, "search_names");

    // Common predicates
    const statusFilter = status
      ? eq(taxaTbl.status, status)
      : eq(taxaTbl.status, "active");

    // When q is provided, filter on names.value (trigram index)
    if (likeAnywhere) {
      const filters: (SQL | undefined)[] = [
        statusFilter,
        ids && ids.length ? inArray(taxaTbl.id, ids) : undefined,
        ilike(searchNames.value, likeAnywhere),
      ];
      const where = and(...(filters.filter(Boolean) as SQL[]));

      const items = await db
        .select(selectTaxonDTO)
        .from(taxaTbl)
        .innerJoin(searchNames, eq(searchNames.taxonId, taxaTbl.id))
        .innerJoin(sci, sciJoinPred)
        .where(where)
        .groupBy(
          taxaTbl.id,
          taxaTbl.rank,
          taxaTbl.sourceGbifId,
          taxaTbl.sourceInatId,
          taxaTbl.status,
          sci.value
        )
        .orderBy(asc(taxaTbl.rank), asc(taxaTbl.id))
        .limit(pageSize)
        .offset(offset);

      // Total count with same predicate (distinct taxa)
      const [{ total }] = await db
        .select({ total: countDistinct(taxaTbl.id) })
        .from(taxaTbl)
        .innerJoin(searchNames, eq(searchNames.taxonId, taxaTbl.id))
        .where(where);

      return { items, page, pageSize, total };
    }

    // No q: only list active taxa; still include accepted scientific name
    const baseFilters: (SQL | undefined)[] = [
      statusFilter,
      ids && ids.length ? inArray(taxaTbl.id, ids) : undefined,
    ];
    const where = and(...(baseFilters.filter(Boolean) as SQL[]));

    const items = await db
      .select(selectTaxonDTO)
      .from(taxaTbl)
      .innerJoin(sci, sciJoinPred)
      .where(where)
      .orderBy(asc(taxaTbl.rank), asc(taxaTbl.id))
      .limit(pageSize)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(taxaTbl)
      .where(where);

    return { items, page, pageSize, total };
  });

export const getTaxon = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      id: z.number(),
    })
  )
  .handler(async ({ data }): Promise<TaxonDTO> => {
    const rows = await db
      .select(selectTaxonDTO)
      .from(taxaTbl)
      .innerJoin(sci, sciJoinPred)
      .where(eq(taxaTbl.id, data.id))
      .limit(1);

    const u = rows[0];
    if (!u) throw notFound();
    return u;
  });

export const createTaxon = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(
    z.object({
      accepted_name: z.string().nonempty(),
      parent_id: z.int().nullable(),
      rank: z.enum(TAXON_RANKS_DESCENDING),
    })
  )
  .handler(async ({ data }): Promise<TaxonDTO> => {
    const { accepted_name, parent_id, rank } = data;

    return await db.transaction(async (tx) => {
      await assertHierarchyInvariant({
        tx,
        nextParentId: parent_id,
        nextRank: rank,
      });

      const [taxon] = await tx
        .insert(taxaTbl)
        .values({ parentId: parent_id, rank })
        .returning();

      await tx.insert(namesTbl).values({
        value: accepted_name,
        taxonId: taxon.id,
        kind: "scientific",
      });

      await assertExactlyOneAcceptedScientificName(tx, taxon.id);

      const [dto] = await tx
        .select(selectTaxonDTO)
        .from(taxaTbl)
        .innerJoin(sci, sciJoinPred)
        .where(eq(taxaTbl.id, taxon.id))
        .limit(1);

      if (!dto) throw notFound();
      return dto;
    });
  });

export const publishTaxon = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }): Promise<TaxonDTO> => {
    const { id } = data;
    return await db.transaction(async (tx) => {
      const current = await getCurrentTaxonMinimal(tx, id);
      if (current.status !== "draft") {
        throw new Error("Only draft taxa can be published.");
      }

      // Ensure structure is valid at publish time and a scientific name exists.
      await assertHierarchyInvariant({
        tx,
        nextParentId: current.parentId,
        nextRank: current.rank,
      });
      await assertExactlyOneAcceptedScientificName(tx, id);

      await tx
        .update(taxaTbl)
        .set({ status: "active" })
        .where(eq(taxaTbl.id, id));

      // Return updated DTO
      const [dto] = await tx
        .select(selectTaxonDTO)
        .from(taxaTbl)
        .innerJoin(sci, sciJoinPred)
        .where(eq(taxaTbl.id, id))
        .limit(1);

      if (!dto) throw notFound();
      return dto;
    });
  });

export const deprecateTaxon = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(
    z.object({
      id: z.number(),
      replaced_by_id: z.number().optional().nullable(),
    })
  )
  .handler(async ({ data }): Promise<TaxonDTO> => {
    const { id, replaced_by_id } = data;

    return await db.transaction(async (tx) => {
      const current = await getCurrentTaxonMinimal(tx, id);
      if (current.status !== "active") {
        throw new Error("Only active taxa can be deprecated.");
      }

      // Don't allow deprecating with active children
      const [{ activeChildren }] = await tx
        .select({ activeChildren: count() })
        .from(taxaTbl)
        .where(and(eq(taxaTbl.parentId, id), eq(taxaTbl.status, "active")));

      if (Number(activeChildren) > 0) {
        throw new Error("Cannot deprecate a taxon that has active children.");
      }

      if (replaced_by_id) {
        if (replaced_by_id === id)
          throw new Error("Taxon cannot replace itself.");
        const replacement = await getCurrentTaxonMinimal(tx, replaced_by_id);
        if (replacement.status !== "active") {
          throw new Error("Replacement taxon must be active.");
        }
      }

      await tx
        .update(taxaTbl)
        .set({ status: "deprecated", replacedById: replaced_by_id ?? null })
        .where(eq(taxaTbl.id, id));

      const [dto] = await tx
        .select(selectTaxonDTO)
        .from(taxaTbl)
        .innerJoin(sci, sciJoinPred)
        .where(eq(taxaTbl.id, id))
        .limit(1);

      if (!dto) throw notFound();
      return dto;
    });
  });

export const deleteTaxon = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }): Promise<{ id: number }> => {
    const { id } = data;

    return await db.transaction(async (tx) => {
      const current = await getCurrentTaxonMinimal(tx, id);
      if (current.status !== "draft") {
        throw new Error("Only draft taxa can be deleted.");
      }

      const childCount = await getChildCount(tx, id);
      if (childCount > 0) {
        throw new Error("Cannot delete a taxon that has children.");
      }

      const deleted = await tx
        .delete(taxaTbl)
        .where(eq(taxaTbl.id, id))
        .returning({ id: taxaTbl.id });

      if (deleted.length === 0) throw notFound();
      return deleted[0];
    });
  });

export const updateTaxon = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(
    z
      .object({
        id: z.number(),
      })
      .and(taxonPatchSchema)
      .superRefine((data, ctx) => {
        // enforce
        const { id, ...rest } = data as Record<string, unknown>;
        const hasAny = Object.values(rest).some((v) => v !== undefined);
        if (!hasAny) {
          ctx.addIssue({
            code: "custom",
            message: "At least one field must be provided to update.",
            path: [],
          });
        }
      })
  )
  .handler(async ({ data }): Promise<TaxonDTO> => {
    const { id, ...updates } = data;

    return await db.transaction(async (tx) => {
      const current = await getCurrentTaxonMinimal(tx, id);
      if (current.status === "deprecated") {
        throw new Error("Deprecated taxa cannot be updated.");
      }

      const nextParentId =
        "parent_id" in updates ? (updates.parent_id ?? null) : current.parentId;
      const nextRank =
        "rank" in updates ? (updates.rank ?? current.rank) : current.rank;

      // Make sure new rank hierarchy isn't invalid
      if ("parent_id" in updates || "rank" in updates) {
        await assertHierarchyInvariant({
          tx,
          nextParentId,
          nextRank,
        });
      }

      // Prevent self-parenting
      if (nextParentId === id) {
        throw new Error("A taxon cannot be its own parent.");
      }

      // Build update payload
      const updatePayload: Record<string, unknown> = {};
      if ("parent_id" in updates) updatePayload.parentId = updates.parent_id;
      if ("rank" in updates) updatePayload.rank = updates.rank;
      if ("source_gbif_id" in updates)
        updatePayload.sourceGbifId = updates.source_gbif_id;
      if ("source_inat_id" in updates)
        updatePayload.sourceInatId = updates.source_inat_id;
      if ("media" in updates) updatePayload.media = updates.media;
      if ("notes" in updates) updatePayload.notes = updates.notes;

      const updated = await tx
        .update(taxaTbl)
        .set(updatePayload)
        .where(eq(taxaTbl.id, id))
        .returning({ id: taxaTbl.id });

      if (updated.length === 0) throw notFound();

      const [dto] = await tx
        .select(selectTaxonDTO)
        .from(taxaTbl)
        .innerJoin(sci, sciJoinPred)
        .where(eq(taxaTbl.id, id))
        .limit(1);

      if (!dto) throw notFound();
      return dto;
    });
  });
