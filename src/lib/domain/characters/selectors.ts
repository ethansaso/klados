import { eq, inArray, sql } from "drizzle-orm";
import { unionAll } from "drizzle-orm/pg-core";
import { db } from "../../../../db/client";
import {
  categoricalCharacterMeta as catMetaTbl,
  numericCharacterMeta as numMetaTbl,
  taxonFeatureState as tfsTbl,
  taxonCharacterStateCategorical as valCatTbl,
  taxonCharacterStateNumber as valNumTbl,
  taxonCharacterStateRange as valRangeTbl,
} from "../../../../db/schema/schema";

/**
 * Usage (distinct taxa) per character, computed only for `ids`.
 */
export function characterUsageFor(ids: number[]) {
  const states = unionAll(
    db
      .select({ characterId: valCatTbl.characterId, taxonId: tfsTbl.taxonId })
      .from(valCatTbl)
      .innerJoin(tfsTbl, eq(tfsTbl.id, valCatTbl.taxonFeatureStateId))
      .where(inArray(valCatTbl.characterId, ids)),
    db
      .select({ characterId: valNumTbl.characterId, taxonId: tfsTbl.taxonId })
      .from(valNumTbl)
      .innerJoin(tfsTbl, eq(tfsTbl.id, valNumTbl.taxonFeatureStateId))
      .where(inArray(valNumTbl.characterId, ids)),
    db
      .select({ characterId: valRangeTbl.characterId, taxonId: tfsTbl.taxonId })
      .from(valRangeTbl)
      .innerJoin(tfsTbl, eq(tfsTbl.id, valRangeTbl.taxonFeatureStateId))
      .where(inArray(valRangeTbl.characterId, ids)),
  ).as("character_states");

  return db
    .select({
      characterId: states.characterId,
      usageCount: sql<number>`COUNT(DISTINCT ${states.taxonId})::int`.as(
        "usage_count",
      ),
    })
    .from(states)
    .groupBy(states.characterId)
    .as("character_usage");
}

// Only include characters that have a meta row (should be all of them)
export const hasSomeMetaExpr = sql`
  (${catMetaTbl.characterId} IS NOT NULL
   OR ${numMetaTbl.characterId} IS NOT NULL)
`;

// Select kind of character
export const characterTypeExpr = sql<"categorical" | "number" | "range">`
  CASE
    WHEN ${catMetaTbl.characterId} IS NOT NULL THEN 'categorical'
    WHEN ${numMetaTbl.kind} = 'single' THEN 'number'
    WHEN ${numMetaTbl.kind} = 'range' THEN 'range'
    ELSE 'categorical'
  END
`;
