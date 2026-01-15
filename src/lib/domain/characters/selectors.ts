import { sql } from "drizzle-orm";
import { db } from "../../../db/client";
import {
  categoricalCharacterMeta as catMetaTbl,
  numericCharacterMeta as numMetaTbl,
  taxonCharacterStateCategorical as valCatTbl,
  taxonCharacterStateNumber as valNumTbl,
  taxonCharacterStateRange as valRangeTbl,
} from "../../../db/schema/schema";

export const catUsageSel = db
  .select({
    characterId: valCatTbl.characterId,
    usageCount: sql<number>`COUNT(DISTINCT ${valCatTbl.taxonId})`,
  })
  .from(valCatTbl)
  .groupBy(valCatTbl.characterId)
  .as("cat_usage");

export const numUsageSel = db
  .select({
    characterId: valNumTbl.characterId,
    usageCount: sql<number>`COUNT(DISTINCT ${valNumTbl.taxonId})`,
  })
  .from(valNumTbl)
  .groupBy(valNumTbl.characterId)
  .as("num_usage");

export const rangeUsageSel = db
  .select({
    characterId: valRangeTbl.characterId,
    usageCount: sql<number>`COUNT(DISTINCT ${valRangeTbl.taxonId})`,
  })
  .from(valRangeTbl)
  .groupBy(valRangeTbl.characterId)
  .as("range_usage");

// Only include characters that have a meta row (should be all of them)
export const hasSomeMetaExpr = sql`
  ${catMetaTbl.characterId} IS NOT NULL
  OR ${numMetaTbl.characterId} IS NOT NULL
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
