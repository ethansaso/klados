import { count, eq } from "drizzle-orm";
import { db } from "../../../../db/client";
import {
  guide as guideTbl,
  taxon as taxonTbl,
  user as userTbl,
} from "../../../../db/schema/schema";
import type { SummaryStatsDTO } from "./types";

export async function fetchSummaryStats(): Promise<SummaryStatsDTO> {
  const [taxonRows, memberRows, guideRows] = await Promise.all([
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

    // All guides
    db
      .select({
        value: count(),
      })
      .from(guideTbl),
  ]);

  const taxaCount = Number(taxonRows[0]?.value ?? 0);
  const memberCount = Number(memberRows[0]?.value ?? 0);
  const guidesCount = Number(guideRows[0]?.value ?? 0);

  return {
    taxaCount,
    memberCount,
    guidesCount,
  };
}
