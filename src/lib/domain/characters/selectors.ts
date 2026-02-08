import { eq, sql } from "drizzle-orm";
import { db } from "../../../../db/client";
import {
  categoricalCharacterMeta as catMetaTbl,
  numericCharacterMeta as numMetaTbl,
  taxonCharacterGroupState as tgsTbl,
  taxonCharacterStateCategorical as valCatTbl,
  taxonCharacterStateNumber as valNumTbl,
  taxonCharacterStateRange as valRangeTbl,
} from "../../../../db/schema/schema";

export const catUsageSel = db
  .select({
    characterId: valCatTbl.characterId,
    catUsageCount: sql<number>`
      COUNT(DISTINCT ${tgsTbl.taxonId})
    `.as("catUsageCount"),
  })
  .from(valCatTbl)
  .innerJoin(tgsTbl, eq(tgsTbl.id, valCatTbl.taxonGroupStateId))
  .groupBy(valCatTbl.characterId)
  .as("cat_usage");

export const numUsageSel = db
  .select({
    characterId: valNumTbl.characterId,
    numUsageCount: sql<number>`
      COUNT(DISTINCT ${tgsTbl.taxonId})
    `.as("numUsageCount"),
  })
  .from(valNumTbl)
  .innerJoin(tgsTbl, eq(tgsTbl.id, valNumTbl.taxonGroupStateId))
  .groupBy(valNumTbl.characterId)
  .as("num_usage");

export const rangeUsageSel = db
  .select({
    characterId: valRangeTbl.characterId,
    rangeUsageCount: sql<number>`
      COUNT(DISTINCT ${tgsTbl.taxonId})
    `.as("rangeUsageCount"),
  })
  .from(valRangeTbl)
  .innerJoin(tgsTbl, eq(tgsTbl.id, valRangeTbl.taxonGroupStateId))
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
