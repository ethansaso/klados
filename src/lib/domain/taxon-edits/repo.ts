import { count, desc, eq } from "drizzle-orm";
import { db } from "../../../../db/client";
import { user as userTbl } from "../../../../db/schema/schema";
import { taxon as taxaTbl } from "../../../../db/schema/taxa/taxon";
import {
  taxonEdit as taxonEditTbl,
  type TaxonEditKind,
} from "../../../../db/schema/taxa/taxonEdit";
import type { PaginationParams } from "../../validation/pagination";
import type { Transaction, TxOrDb } from "../../utils/types/transactionType";
import { selectMediaByTaxonIds } from "../media/repo";
import {
  common,
  commonJoinPred,
  sci,
  sciJoinPred,
  taxonSelector,
} from "../taxa/sqlAdapters";
import { userDtoSelection } from "../users/sqlAdapters";
import type {
  TaxonCurationDTO,
  TaxonEditAreas,
  TaxonEditLogPaginatedResult,
} from "./types";

const curationSelection = {
  id: taxonEditTbl.id,
  kind: taxonEditTbl.kind,
  names: taxonEditTbl.names,
  taxonomy: taxonEditTbl.taxonomy,
  externalIds: taxonEditTbl.externalIds,
  morphology: taxonEditTbl.morphology,
  media: taxonEditTbl.media,
  sources: taxonEditTbl.sources,
  ecology: taxonEditTbl.ecology,
  notes: taxonEditTbl.notes,
  createdAt: taxonEditTbl.createdAt,
  user: userDtoSelection,
};

export async function insertTaxonEdit(
  tx: Transaction,
  args: {
    taxonId: number;
    actorId: string;
    kind: TaxonEditKind;
    areas?: TaxonEditAreas;
  },
): Promise<void> {
  await tx.insert(taxonEditTbl).values({
    taxonId: args.taxonId,
    userId: args.actorId,
    kind: args.kind,
    ...args.areas,
  });
}

/** Newest first. */
export async function selectTaxonCuration(
  tx: TxOrDb,
  taxonId: number,
): Promise<TaxonCurationDTO[]> {
  return tx
    .select(curationSelection)
    .from(taxonEditTbl)
    .leftJoin(userTbl, eq(userTbl.id, taxonEditTbl.userId))
    .where(eq(taxonEditTbl.taxonId, taxonId))
    .orderBy(desc(taxonEditTbl.createdAt), desc(taxonEditTbl.id));
}

/** All taxa, newest first. */
export async function selectTaxonEditLogPage({
  page,
  pageSize,
}: PaginationParams): Promise<TaxonEditLogPaginatedResult> {
  const rows = await db
    .select({ ...curationSelection, taxon: taxonSelector })
    .from(taxonEditTbl)
    .innerJoin(taxaTbl, eq(taxaTbl.id, taxonEditTbl.taxonId))
    .innerJoin(sci, sciJoinPred)
    .leftJoin(common, commonJoinPred)
    .leftJoin(userTbl, eq(userTbl.id, taxonEditTbl.userId))
    .orderBy(desc(taxonEditTbl.createdAt), desc(taxonEditTbl.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const [totals] = await db.select({ total: count() }).from(taxonEditTbl);
  const mediaMap = await selectMediaByTaxonIds(rows.map((r) => r.taxon.id));
  const items = rows.map((row) => ({
    ...row,
    taxon: { ...row.taxon, media: mediaMap.get(row.taxon.id) ?? [] },
  }));

  return { items, page, pageSize, total: totals?.total ?? 0 };
}
