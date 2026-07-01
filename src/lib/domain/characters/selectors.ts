import { eq, sql } from "drizzle-orm";
import { db } from "../../../../db/client";
import {
  categoricalCharacterMeta as catMetaTbl,
  numericCharacterMeta as numMetaTbl,
  taxonFeatureState as tfsTbl,
  categoricalTraitValue as traitValueTbl,
  taxonCharacterStateCategorical as valCatTbl,
  taxonCharacterStateNumber as valNumTbl,
  taxonCharacterStateRange as valRangeTbl,
} from "../../../../db/schema/schema";

export const catTraitCountSel = db
  .select({
    characterId: traitValueTbl.characterId,
    traitCount: sql<number>`COUNT(*)`.as("traitCount"),
  })
  .from(traitValueTbl)
  .groupBy(traitValueTbl.characterId)
  .as("cat_trait_count");

export const catUsageSel = db
  .select({
    characterId: valCatTbl.characterId,
    catUsageCount: sql<number>`
      COUNT(DISTINCT ${tfsTbl.taxonId})
    `.as("catUsageCount"),
  })
  .from(valCatTbl)
  .innerJoin(tfsTbl, eq(tfsTbl.id, valCatTbl.taxonFeatureStateId))
  .groupBy(valCatTbl.characterId)
  .as("cat_usage");

export const numUsageSel = db
  .select({
    characterId: valNumTbl.characterId,
    numUsageCount: sql<number>`
      COUNT(DISTINCT ${tfsTbl.taxonId})
    `.as("numUsageCount"),
  })
  .from(valNumTbl)
  .innerJoin(tfsTbl, eq(tfsTbl.id, valNumTbl.taxonFeatureStateId))
  .groupBy(valNumTbl.characterId)
  .as("num_usage");

export const rangeUsageSel = db
  .select({
    characterId: valRangeTbl.characterId,
    rangeUsageCount: sql<number>`
      COUNT(DISTINCT ${tfsTbl.taxonId})
    `.as("rangeUsageCount"),
  })
  .from(valRangeTbl)
  .innerJoin(tfsTbl, eq(tfsTbl.id, valRangeTbl.taxonFeatureStateId))
  .groupBy(valRangeTbl.characterId)
  .as("range_usage");

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
