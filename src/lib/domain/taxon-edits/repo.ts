import { desc, eq } from "drizzle-orm";
import { user as userTbl } from "../../../../db/schema/schema";
import {
  taxonEdit as taxonEditTbl,
  type TaxonEditAction,
} from "../../../../db/schema/taxa/taxonEdit";
import type { Transaction, TxOrDb } from "../../utils/types/transactionType";
import { userDtoSelection } from "../users/sqlAdapters";
import type { TaxonCurationDTO, TaxonEditAreas } from "./types";

export async function insertTaxonEdit(
  tx: Transaction,
  args: {
    taxonId: number;
    actorId: string;
    action: TaxonEditAction;
    areas?: TaxonEditAreas;
  },
): Promise<void> {
  await tx.insert(taxonEditTbl).values({
    taxonId: args.taxonId,
    userId: args.actorId,
    action: args.action,
    ...args.areas,
  });
}

/** Newest first. */
export async function selectTaxonCuration(
  tx: TxOrDb,
  taxonId: number,
): Promise<TaxonCurationDTO[]> {
  return tx
    .select({
      id: taxonEditTbl.id,
      kind: taxonEditTbl.action,
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
    })
    .from(taxonEditTbl)
    .leftJoin(userTbl, eq(userTbl.id, taxonEditTbl.userId))
    .where(eq(taxonEditTbl.taxonId, taxonId))
    .orderBy(desc(taxonEditTbl.createdAt), desc(taxonEditTbl.id));
}
