import { count, eq } from "drizzle-orm";
import { db } from "../../../db/client";
import {
  dichotomousKey as keyTbl,
  taxon as taxonTbl,
  user as userTbl,
} from "../../../db/schema/schema";
import type { SummaryStatsDTO } from "./types";

export async function fetchSummaryStats(): Promise<SummaryStatsDTO> {
  const [taxaRows, memberRows, keysRows] = await Promise.all([
    // Only active taxa
    db
      .select({
        value: count(),
      })
      .from(taxonTbl)
      .where(eq(taxonTbl.status, "active")),

    // Only non-banned users
    db
      .select({
        value: count(),
      })
      .from(userTbl)
      .where(eq(userTbl.banned, false)),

    // All dichotomous keys
    db
      .select({
        value: count(),
      })
      .from(keyTbl),
  ]);

  const taxaCount = Number(taxaRows[0]?.value ?? 0);
  const memberCount = Number(memberRows[0]?.value ?? 0);
  const keysCount = Number(keysRows[0]?.value ?? 0);

  return {
    taxaCount,
    memberCount,
    keysCount,
  };
}
