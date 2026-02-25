import { sql } from "drizzle-orm";
import { db } from "../../../../db/client";
import {
  taxonCharacterStateModifierCategorical as modCatTbl,
  taxonCharacterStateModifierNumber as modNumTbl,
  taxonCharacterStateModifierRange as modRangeTbl,
} from "../../../../db/schema/schema";

export const modCatUsageSel = db
  .select({
    modifierId: modCatTbl.modifierId,
    catUsageCount: sql<number>`COUNT(*)`.as("catUsageCount"),
  })
  .from(modCatTbl)
  .groupBy(modCatTbl.modifierId)
  .as("mod_cat_usage");

export const modNumUsageSel = db
  .select({
    modifierId: modNumTbl.modifierId,
    numUsageCount: sql<number>`COUNT(*)`.as("numUsageCount"),
  })
  .from(modNumTbl)
  .groupBy(modNumTbl.modifierId)
  .as("mod_num_usage");

export const modRangeUsageSel = db
  .select({
    modifierId: modRangeTbl.modifierId,
    rangeUsageCount: sql<number>`COUNT(*)`.as("rangeUsageCount"),
  })
  .from(modRangeTbl)
  .groupBy(modRangeTbl.modifierId)
  .as("mod_range_usage");
