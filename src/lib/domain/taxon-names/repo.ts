import { eq } from "drizzle-orm";
import { taxonName as namesTbl } from "../../../db/schema/taxa/name";
import { Transaction } from "../../utils/transactionType";
import { NameItem } from "./validation";

export async function replaceNamesForTaxon(
  tx: Transaction,
  taxonId: number,
  names: NameItem[]
): Promise<void> {
  await tx.delete(namesTbl).where(eq(namesTbl.taxonId, taxonId));

  if (names.length === 0) return;

  await tx.insert(namesTbl).values(
    names.map((n) => ({
      taxonId,
      value: n.value.trim(),
      locale: n.locale,
      isPreferred: n.isPreferred,
    }))
  );
}
