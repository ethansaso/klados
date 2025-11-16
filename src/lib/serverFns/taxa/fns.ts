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
import { taxonName as namesTbl } from "../../../db/schema/taxa/name";
import {
  taxon as taxaTbl,
  TAXON_RANKS_DESCENDING,
} from "../../../db/schema/taxa/taxon";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { assertHierarchyInvariant } from "../../utils/assertHierarchyInvariant";
import { PaginationSchema } from "../../validation/pagination";
import { NameItem } from "../taxon-names/validation";
import { TaxonDetailDTO, TaxonDTO, TaxonPaginatedResult } from "./types";
import {
  assertExactlyOneAcceptedScientificName,
  getChildCount,
  getCurrentTaxonMinimal,
} from "./utils";
import { taxonPatchSchema } from "./validation";

const sci = alias(namesTbl, "sci");
const common = alias(namesTbl, "common");
const sciJoinPred = and(
  eq(sci.taxonId, taxaTbl.id),
  eq(sci.locale, "sci"),
  eq(sci.isPreferred, true)
);
const commonJoinPred = and(
  eq(common.taxonId, taxaTbl.id),
  eq(common.locale, "en"),
  eq(common.isPreferred, true)
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
  preferredCommonName: common.value,
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
    const { q, ids, page, pageSize: pageSize, status } = data;
    const offset = (page - 1) * pageSize;

    // Escape %, _ and \ in the search string (no user wildcards)
    const rawQ = q?.trim();
    const likeAnywhere =
      rawQ && rawQ.length
        ? `%${rawQ.replace(/([%_\\])/g, "\\$1")}%`
        : undefined;

    // Aliases for filtering names when searching
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
        .leftJoin(common, commonJoinPred)
        .where(where)
        .groupBy(
          taxaTbl.id,
          taxaTbl.rank,
          taxaTbl.sourceGbifId,
          taxaTbl.sourceInatId,
          taxaTbl.status,
          sci.value,
          common.value
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

    // No q: only list active taxa; still include accepted scientific + preferred common
    const baseFilters: (SQL | undefined)[] = [
      statusFilter,
      ids && ids.length ? inArray(taxaTbl.id, ids) : undefined,
    ];
    const where = and(...(baseFilters.filter(Boolean) as SQL[]));

    const items = await db
      .select(selectTaxonDTO)
      .from(taxaTbl)
      .innerJoin(sci, sciJoinPred)
      .leftJoin(common, commonJoinPred)
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
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }): Promise<TaxonDetailDTO> => {
    const { id } = data;

    const baseRows = await db
      .select(selectTaxonDTO)
      .from(taxaTbl)
      .innerJoin(sci, sciJoinPred)
      .leftJoin(common, commonJoinPred)
      .where(eq(taxaTbl.id, id))
      .limit(1);

    const base = baseRows[0];
    if (!base) throw notFound();

    // Ancestors via one recursive CTE (root → ... → immediate parent)
    type AncRow = TaxonDTO & { depth: number };

    const ancRows = await db.execute<AncRow>(sql`
      WITH RECURSIVE chain AS (
        SELECT t.id, t.parent_id, 0 AS depth
        FROM ${taxaTbl} t
        WHERE t.id = ${id}
        UNION ALL
        SELECT p.id, p.parent_id, chain.depth + 1
        FROM ${taxaTbl} p
        JOIN chain ON p.id = chain.parent_id
        WHERE chain.depth < 256
      )
      SELECT 
        a.id,
        a.parent_id AS "parentId",
        a.rank,
        a.source_gbif_id AS "sourceGbifId",
        a.source_inat_id AS "sourceInatId",
        a.status,
        a.media,
        a.notes,
        s.value  AS "acceptedName",
        pc.value AS "preferredCommonName",
        (
          SELECT COUNT(*)::int
          FROM ${taxaTbl} c
          WHERE c.parent_id = a.id AND c.status = 'active'
        ) AS "activeChildCount",
        chain.depth
      FROM chain
      JOIN ${taxaTbl} a ON a.id = chain.id
      JOIN ${namesTbl} s 
        ON s.taxon_id = a.id 
      AND s.locale = 'sci'
      AND s.is_preferred = true
      LEFT JOIN ${namesTbl} pc
        ON pc.taxon_id = a.id
       AND pc.locale = 'en'
       AND pc.is_preferred = true
      WHERE chain.depth >= 1
      ORDER BY chain.depth DESC
    `);

    const ancestors: TaxonDTO[] = ancRows.rows.map((r) => ({
      id: r.id,
      parentId: r.parentId,
      rank: r.rank,
      sourceGbifId: r.sourceGbifId,
      sourceInatId: r.sourceInatId,
      status: r.status,
      media: r.media,
      notes: r.notes,
      acceptedName: r.acceptedName,
      preferredCommonName: r.preferredCommonName,
      activeChildCount: r.activeChildCount,
    }));

    // Fetch all associated names
    const nameRows = await db
      .select({
        id: namesTbl.id,
        value: namesTbl.value,
        locale: namesTbl.locale,
        isPreferred: namesTbl.isPreferred,
      })
      .from(namesTbl)
      .where(eq(namesTbl.taxonId, id))
      .orderBy(asc(namesTbl.locale), asc(namesTbl.value));

    const names: NameItem[] = nameRows.map((n) => ({
      id: n.id,
      value: n.value,
      locale: n.locale,
      isPreferred: n.isPreferred,
    }));

    // Assemble TaxonDetailDTO (omit parentId, append ancestors and names)
    const { parentId: _omit, ...baseWithoutParent } = base;
    const detail: TaxonDetailDTO = {
      ...baseWithoutParent,
      ancestors,
      names,
    };

    return detail;
  });

export const createTaxonDraft = createServerFn({ method: "POST" })
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
        locale: "sci",
        isPreferred: true,
      });

      await assertExactlyOneAcceptedScientificName(tx, taxon.id);

      const [dto] = await tx
        .select(selectTaxonDTO)
        .from(taxaTbl)
        .innerJoin(sci, sciJoinPred)
        .leftJoin(common, commonJoinPred)
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
        .leftJoin(common, commonJoinPred)
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
        .leftJoin(common, commonJoinPred)
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
        const { id, parent_id, ...rest } = data as Record<string, unknown>;
        // 1) At least one field to update
        const hasAny = Object.values(rest).some((v) => v !== undefined);
        if (!hasAny) {
          ctx.addIssue({
            code: "custom",
            message: "At least one field must be provided to update.",
            path: [],
          });
        }
        // 2) parent_id cannot be the same as id
        if (parent_id != null && parent_id === id) {
          ctx.addIssue({
            code: "custom",
            message: "A taxon's parent cannot be itself.",
            path: ["parent_id"],
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

      // Build update payload for the taxon row
      const updatePayload: Record<string, unknown> = {};
      if ("parent_id" in updates) updatePayload.parentId = updates.parent_id;
      if ("rank" in updates) updatePayload.rank = updates.rank;
      if ("source_gbif_id" in updates)
        updatePayload.sourceGbifId = updates.source_gbif_id;
      if ("source_inat_id" in updates)
        updatePayload.sourceInatId = updates.source_inat_id;
      if ("media" in updates) updatePayload.media = updates.media;
      if ("notes" in updates) updatePayload.notes = updates.notes;

      // Only issue UPDATE if there are scalar fields to change.
      if (Object.keys(updatePayload).length > 0) {
        const updated = await tx
          .update(taxaTbl)
          .set(updatePayload)
          .where(eq(taxaTbl.id, id))
          .returning({ id: taxaTbl.id });

        if (updated.length === 0) throw notFound();
      }

      // Handle names replacement (scientific + commons)
      if ("names" in updates && updates.names) {
        const incomingNames = updates.names as NameItem[];

        // Invariant 1: exactly one preferred scientific name (locale = 'sci')
        const sciPreferredCount = incomingNames.filter(
          (n) => n.locale === "sci" && n.isPreferred
        ).length;
        if (sciPreferredCount !== 1) {
          throw new Error(
            "Exactly one preferred scientific name (locale 'sci') is required when updating names."
          );
        }

        // Invariant 2: at most one preferred common per non-'sci' locale
        const preferredPerLocale = new Map<string, number>();
        for (const n of incomingNames) {
          if (n.locale === "sci" || !n.isPreferred) continue;
          const prev = preferredPerLocale.get(n.locale) ?? 0;
          if (prev >= 1) {
            throw new Error(
              `At most one preferred common name is allowed per locale; duplicate for locale "${n.locale}".`
            );
          }
          preferredPerLocale.set(n.locale, prev + 1);
        }

        // Simple semantics: replace all names for this taxon with the provided set.
        await tx.delete(namesTbl).where(eq(namesTbl.taxonId, id));

        if (incomingNames.length > 0) {
          await tx.insert(namesTbl).values(
            incomingNames.map((n) => ({
              taxonId: id,
              value: n.value.trim(),
              locale: n.locale,
              isPreferred: n.isPreferred,
            }))
          );
        }

        // Double-check only one accepted scientific name exists now
        await assertExactlyOneAcceptedScientificName(tx, id);
      }

      const [dto] = await tx
        .select(selectTaxonDTO)
        .from(taxaTbl)
        .innerJoin(sci, sciJoinPred)
        .leftJoin(common, commonJoinPred)
        .where(eq(taxaTbl.id, id))
        .limit(1);

      if (!dto) throw notFound();
      return dto;
    });
  });
