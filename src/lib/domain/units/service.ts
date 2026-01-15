import { db } from "../../../db/client";
import { Transaction } from "../../utils/transactionType";
import { listUnitFamiliesQuery, selectUnitFamilyById } from "./repo";
import { UnitFamilyDTO } from "./types";

export async function getUnitFamily(args: {
  id: number;
}): Promise<UnitFamilyDTO | null> {
  return db.transaction(async (tx) => {
    return selectUnitFamilyById(tx as Transaction, args.id);
  });
}

export async function listUnitFamilies(args?: {
  q?: string;
}): Promise<UnitFamilyDTO[]> {
  return db.transaction(async (tx) => {
    return listUnitFamiliesQuery(tx as Transaction, args?.q);
  });
}
