import { and, desc, eq, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "../../../../db/client";
import {
  taxon as taxaTbl,
  taxonCharacterStateCategorical as tcsCatTbl,
  taxonFeatureState as tfsTbl,
  categoricalTraitValue as traitValTbl,
} from "../../../../db/schema/schema";
import { taxonName as namesTbl } from "../../../../db/schema/taxa/name";
import { selectMediaByTaxonIds } from "../media/repo";
import type { TaxonLookalikeDTO } from "./types";

export async function computeTaxonLookalikesByCategoricalOverlap(args: {
  taxonId: number;
  limit: number;
  minShared?: number;
}): Promise<TaxonLookalikeDTO[]> {
  const limit = args.limit;
  const minShared = args.minShared ?? 2;

  const [targetTaxon] = await db
    .select({ rank: taxaTbl.rank })
    .from(taxaTbl)
    .where(eq(taxaTbl.id, args.taxonId))
    .limit(1);

  if (!targetTaxon) return [];

  const sci = alias(namesTbl, "sci");
  const common = alias(namesTbl, "common");

  // Target's distinct observations, each one a (feature, character, set) triple
  const target = db
    .select({
      featureId: tfsTbl.featureId,
      characterId: tcsCatTbl.characterId,
      synonymSetId: traitValTbl.synonymSetId,
    })
    .from(tcsCatTbl)
    .innerJoin(traitValTbl, eq(traitValTbl.id, tcsCatTbl.traitValueId))
    .innerJoin(tfsTbl, eq(tfsTbl.id, tcsCatTbl.taxonFeatureStateId))
    .where(eq(tfsTbl.taxonId, args.taxonId))
    .groupBy(tfsTbl.featureId, tcsCatTbl.characterId, traitValTbl.synonymSetId)
    .as("target");

  // |A|: how many observations the target has
  const targetCountSq = db
    .select({
      targetCnt: sql<number>`count(*)::int`.as("target_cnt"),
    })
    .from(target)
    .as("target_cnt");

  // Alias for matching candidate rows against the target's sets
  const tv2 = alias(traitValTbl, "tv2");

  // |A n B|, distinct since a taxon may record several labels from one set
  const sharedCountBase = sql<number>`
  count(distinct (
    ${tfsTbl.featureId},
    ${tcsCatTbl.characterId},
    ${tv2.synonymSetId}
  ))::int
`;

  const sharedCountExpr = sharedCountBase.as("shared_cnt");

  // Candidates overlapping the target by at least minShared observations
  const shared = db
    .select({
      otherTaxonId: tfsTbl.taxonId,
      sharedCnt: sharedCountExpr,
    })
    .from(target)
    .innerJoin(tcsCatTbl, eq(tcsCatTbl.characterId, target.characterId))
    .innerJoin(
      tfsTbl,
      and(
        eq(tfsTbl.id, tcsCatTbl.taxonFeatureStateId),
        eq(tfsTbl.featureId, target.featureId),
      ),
    )
    .innerJoin(
      tv2,
      and(
        eq(tv2.id, tcsCatTbl.traitValueId),
        eq(tv2.synonymSetId, target.synonymSetId),
      ),
    )
    .where(ne(tfsTbl.taxonId, args.taxonId))
    .groupBy(tfsTbl.taxonId)
    .having(sql`${sharedCountBase} >= ${minShared}`)
    .as("shared");

  // Alias for counting each candidate's own observations
  const tv3 = alias(traitValTbl, "tv3");

  // |B|: each candidate's total observations, scoped to the candidates above
  const otherCnt = db
    .select({
      taxonId: tfsTbl.taxonId,
      otherCnt: sql<number>`
      count(distinct (${tfsTbl.featureId}, ${tcsCatTbl.characterId}, ${tv3.synonymSetId}))::int
    `.as("other_cnt"),
    })
    .from(tcsCatTbl)
    .innerJoin(tfsTbl, eq(tfsTbl.id, tcsCatTbl.taxonFeatureStateId))
    .innerJoin(shared, eq(shared.otherTaxonId, tfsTbl.taxonId))
    .innerJoin(tv3, eq(tv3.id, tcsCatTbl.traitValueId))
    .groupBy(tfsTbl.taxonId)
    .as("other_cnt");

  // Jaccard over observation sets, plus the fraction of the target matched
  const jaccardExpr = sql<number>`
    (${shared.sharedCnt}::float /
      nullif((${targetCountSq.targetCnt} + ${otherCnt.otherCnt} - ${shared.sharedCnt}), 0)
    )
  `.as("jaccard");
  const pctTargetExpr = sql<number>`
    (${shared.sharedCnt}::float / nullif(${targetCountSq.targetCnt}, 0))
  `.as("pct_of_target_matched");

  // Same rank and active only, best similarity first
  const rows = await db
    .select({
      id: taxaTbl.id,
      rank: taxaTbl.rank,
      acceptedName: sci.value,
      preferredCommonName: common.value,

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
    .where(
      and(eq(taxaTbl.status, "active"), eq(taxaTbl.rank, targetTaxon.rank)),
    )
    .orderBy(desc(jaccardExpr), desc(shared.sharedCnt), taxaTbl.id)
    .limit(limit);

  // Separate query, since joining media would multiply rows and skew the counts
  const mediaMap = await selectMediaByTaxonIds(rows.map((r) => r.id));

  return rows.map((r) => ({ ...r, media: mediaMap.get(r.id) ?? [] }));
}
