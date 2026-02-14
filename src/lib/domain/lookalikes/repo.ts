import { and, desc, eq, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "../../../../db/client";
import {
  taxon as taxaTbl,
  taxonCharacterStateCategorical as tcsCatTbl,
  taxonFeatureState as tgsTbl,
  categoricalTraitValue as traitValTbl,
} from "../../../../db/schema/schema";
import { taxonName as namesTbl } from "../../../../db/schema/taxa/name";
import type { TaxonLookalikeDTO } from "./types";

export async function computeTaxonLookalikesByCategoricalOverlap(args: {
  taxonId: number;
  limit: number;
  minShared?: number;
}): Promise<TaxonLookalikeDTO[]> {
  const limit = args.limit;
  const minShared = args.minShared ?? 2;

  const sci = alias(namesTbl, "sci");
  const common = alias(namesTbl, "common");

  // Collapses non-canonical into canonical
  const canonTraitId = sql<number>`coalesce(${traitValTbl.canonicalValueId}, ${traitValTbl.id})`;

  // Request taxon's categorical character states
  const target = db
    .select({
      characterId: tcsCatTbl.characterId,
      canonTraitValueId: canonTraitId.as("canon_trait_value_id"),
    })
    .from(tcsCatTbl)
    .innerJoin(traitValTbl, eq(traitValTbl.id, tcsCatTbl.traitValueId))
    .innerJoin(tgsTbl, eq(tgsTbl.id, tcsCatTbl.taxonFeatureStateId))
    .where(eq(tgsTbl.taxonId, args.taxonId))
    .groupBy(tcsCatTbl.characterId, canonTraitId)
    .as("target");

  // Get simple count of target's categorical features
  const targetCountSq = db
    .select({
      targetCnt: sql<number>`count(*)::int`.as("target_cnt"),
    })
    .from(target)
    .as("target_cnt");

  // Alias table to use for other taxa
  const tv2 = alias(traitValTbl, "tv2");
  const canonTraitId2 = sql<number>`coalesce(${tv2.canonicalValueId}, ${tv2.id})`;

  // Count distinct shared (characterId, canonicalTraitValueId) pairs
  const sharedCountBase = sql<number>`
  count(distinct (${tcsCatTbl.characterId}, ${canonTraitId2}))::int
`;
  const sharedCountExpr = sharedCountBase.as("shared_cnt");

  // Find taxa that share categorical character states with the target taxon,
  // along with the count of shared states.
  const shared = db
    .select({
      otherTaxonId: tgsTbl.taxonId,
      sharedCnt: sharedCountExpr,
    })
    .from(target)
    .innerJoin(tcsCatTbl, eq(tcsCatTbl.characterId, target.characterId))
    .innerJoin(tgsTbl, eq(tgsTbl.id, tcsCatTbl.taxonFeatureStateId))
    .innerJoin(
      tv2,
      and(
        eq(tv2.id, tcsCatTbl.traitValueId),
        eq(canonTraitId2, target.canonTraitValueId),
      ),
    )
    .where(ne(tgsTbl.taxonId, args.taxonId))
    .groupBy(tgsTbl.taxonId)
    .having(sql`${sharedCountBase} >= ${minShared}`)
    .as("shared");

  // Alias again to get actual counts for other taxa
  const tv3 = alias(traitValTbl, "tv3");
  const canonTraitId3 = sql<number>`coalesce(${tv3.canonicalValueId}, ${tv3.id})`;

  // Count distinct categorical features for other taxa, restricting to
  // just taxa which share something with the target (`shared`).
  const otherCnt = db
    .select({
      taxonId: tgsTbl.taxonId,
      otherCnt: sql<number>`
      count(distinct (${tcsCatTbl.characterId}, ${canonTraitId3}))::int
    `.as("other_cnt"),
    })
    .from(tcsCatTbl)
    .innerJoin(tgsTbl, eq(tgsTbl.id, tcsCatTbl.taxonFeatureStateId))
    .innerJoin(shared, eq(shared.otherTaxonId, tgsTbl.taxonId))
    .innerJoin(tv3, eq(tv3.id, tcsCatTbl.traitValueId))
    .groupBy(tgsTbl.taxonId)
    .as("other_cnt");

  // Rank by jaccard similarity
  const jaccardExpr = sql<number>`
    (${shared.sharedCnt}::float /
      nullif((${targetCountSq.targetCnt} + ${otherCnt.otherCnt} - ${shared.sharedCnt}), 0)
    )
  `.as("jaccard");
  const pctTargetExpr = sql<number>`
    (${shared.sharedCnt}::float / nullif(${targetCountSq.targetCnt}, 0))
  `.as("pct_of_target_matched");

  // Final select to format results
  const rows = await db
    .select({
      id: taxaTbl.id,
      rank: taxaTbl.rank,
      acceptedName: sci.value,
      preferredCommonName: common.value,
      media: taxaTbl.media,

      sharedCount: shared.sharedCnt,
      jaccard: jaccardExpr,
      pctOfTargetMatched: pctTargetExpr,

      targetCount: targetCountSq.targetCnt,
      otherCount: otherCnt.otherCnt,
    })
    .from(shared)
    .crossJoin(targetCountSq)
    .innerJoin(taxaTbl, eq(taxaTbl.id, shared.otherTaxonId))
    .innerJoin(otherCnt, eq(otherCnt.taxonId, taxaTbl.id))
    .innerJoin(
      sci,
      and(
        eq(sci.taxonId, taxaTbl.id),
        eq(sci.locale, "sci"),
        eq(sci.isPreferred, true),
      ),
    )
    .leftJoin(
      common,
      and(
        eq(common.taxonId, taxaTbl.id),
        eq(common.locale, "en"),
        eq(common.isPreferred, true),
      ),
    )
    .where(eq(taxaTbl.status, "active"))
    .orderBy(desc(jaccardExpr), desc(shared.sharedCnt), taxaTbl.id)
    .limit(limit);

  return rows;
}
