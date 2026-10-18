import { desc, eq } from "drizzle-orm";
import { user as userTbl } from "../../../../db/schema/schema";
import {
  taxonEdit as taxonEditTbl,
  type TaxonEditKind,
} from "../../../../db/schema/taxa/taxonEdit";
import type { Transaction, TxOrDb } from "../../utils/types/transactionType";
import { userDtoSelection } from "../users/sqlAdapters";
import type { TaxonCurationDTO, TaxonEditAreas } from "./types";

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
    .select({
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
    })
    .from(taxonEditTbl)
    .leftJoin(userTbl, eq(userTbl.id, taxonEditTbl.userId))
    .where(eq(taxonEditTbl.taxonId, taxonId))
    .orderBy(desc(taxonEditTbl.createdAt), desc(taxonEditTbl.id));
}
