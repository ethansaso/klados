import { and, desc, eq, ne, sql } from "drizzle-orm";

import {
  taxon as taxaTbl,
  taxonCharacterStateCategorical as tcsCatTbl,
  taxonFeatureState as tfsTbl,
} from "../../../../db/schema/schema";
import type { Transaction } from "../../utils/types/transactionType";
import { supportsLookalikes } from "./util";

/**
 * Cheap candidate pass for lookalike scoring: active same-rank taxa sharing
 * at least `minShared` (feature, character, synonym set) states with the target.
 */
export async function selectLookalikeCandidateIds(
  tx: Transaction,
  args: { taxonId: number; limit: number; minShared?: number },
): Promise<number[]> {
  const minShared = args.minShared ?? 2;

  const [targetTaxon] = await tx
    .select({ rank: taxaTbl.rank })
    .from(taxaTbl)
    .where(eq(taxaTbl.id, args.taxonId))
    .limit(1);

  if (!targetTaxon || !supportsLookalikes(targetTaxon.rank)) return [];

  // Target's distinct (feature, character, set) states
  const target = tx
    .selectDistinct({
      featureId: tfsTbl.featureId,
      characterId: tcsCatTbl.characterId,
      synonymSetId: tcsCatTbl.synonymSetId,
    })
    .from(tcsCatTbl)
    .innerJoin(tfsTbl, eq(tfsTbl.id, tcsCatTbl.taxonFeatureStateId))
    .where(eq(tfsTbl.taxonId, args.taxonId))
    .as("target");

  // Distinct, since a taxon may record several labels from one set
  const sharedCount = sql<number>`count(distinct (
    ${tfsTbl.featureId},
    ${tcsCatTbl.characterId},
    ${tcsCatTbl.synonymSetId}
  ))::int`;

  const rows = await tx
    .select({ id: tfsTbl.taxonId })
    .from(target)
    .innerJoin(
      tcsCatTbl,
      and(
        eq(tcsCatTbl.characterId, target.characterId),
        eq(tcsCatTbl.synonymSetId, target.synonymSetId),
      ),
    )
    .innerJoin(
      tfsTbl,
      and(
        eq(tfsTbl.id, tcsCatTbl.taxonFeatureStateId),
        eq(tfsTbl.featureId, target.featureId),
      ),
    )
    .innerJoin(taxaTbl, eq(taxaTbl.id, tfsTbl.taxonId))
    .where(
      and(
        ne(tfsTbl.taxonId, args.taxonId),
        eq(taxaTbl.status, "active"),
        eq(taxaTbl.rank, targetTaxon.rank),
      ),
    )
    .groupBy(tfsTbl.taxonId)
    .having(sql`${sharedCount} >= ${minShared}`)
    .orderBy(desc(sharedCount), tfsTbl.taxonId)
    .limit(args.limit);

  return rows.map((r) => r.id);
}
