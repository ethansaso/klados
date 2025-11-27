import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../../../db/client";
import { taxonName as namesTbl } from "../../../../db/schema/taxa/name";
import { taxon as taxaTbl } from "../../../../db/schema/taxa/taxon";
import { NameItem } from "../../taxon-names/validation";
import {
  common,
  commonJoinPred,
  sci,
  sciJoinPred,
  selectTaxonDTO,
} from "../sqlAdapters";
import { TaxonDetailDTO, TaxonDTO } from "../types";

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
