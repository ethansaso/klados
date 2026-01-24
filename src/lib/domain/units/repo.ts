import { asc, eq, ilike } from "drizzle-orm";
import {
  unitFamily as unitFamilyTbl,
  unit as unitTbl,
} from "../../../db/schema/characters/units";
import { likeAnywhere } from "../../utils/likeAnywhere";
import type { Transaction } from "../../utils/transactionType";
import type { UnitDTO, UnitFamilyDTO } from "./types";

type UnitFamilyJoinRow = {
  family: { id: number; label: string };
  unit: UnitDTO | null;
};

function rowsToUnitFamilies(rows: UnitFamilyJoinRow[]): UnitFamilyDTO[] {
  const byId = new Map<number, UnitFamilyDTO>();

  for (const r of rows) {
    const famId = r.family.id;

    let fam = byId.get(famId);
    if (!fam) {
      fam = { id: famId, label: r.family.label, units: [] };
      byId.set(famId, fam);
    }

    if (r.unit) fam.units.push(r.unit);
  }

  return Array.from(byId.values());
}

export async function selectUnitFamilyById(
  tx: Transaction,
  unitFamilyId: number,
): Promise<UnitFamilyDTO | null> {
  const rows = await tx
    .select({
      family: { id: unitFamilyTbl.id, label: unitFamilyTbl.label },
      unit: {
        id: unitTbl.id,
        familyId: unitTbl.familyId,
        key: unitTbl.key,
        symbol: unitTbl.symbol,
        scale: unitTbl.scale,
      },
    })
    .from(unitFamilyTbl)
    .leftJoin(unitTbl, eq(unitTbl.familyId, unitFamilyTbl.id))
    .where(eq(unitFamilyTbl.id, unitFamilyId))
    .orderBy(asc(unitTbl.key));

  if (rows.length === 0) return null;

  return rowsToUnitFamilies(rows)[0] ?? null;
}

export async function listUnitFamiliesQuery(
  tx: Transaction,
  q?: string,
): Promise<UnitFamilyDTO[]> {
  const like = likeAnywhere(q);

  const rows = await tx
    .select({
      family: { id: unitFamilyTbl.id, label: unitFamilyTbl.label },
      unit: {
        id: unitTbl.id,
        familyId: unitTbl.familyId,
        key: unitTbl.key,
        symbol: unitTbl.symbol,
        scale: unitTbl.scale,
      },
    })
    .from(unitFamilyTbl)
    .leftJoin(unitTbl, eq(unitTbl.familyId, unitFamilyTbl.id))
    .where(like ? ilike(unitFamilyTbl.label, like) : undefined)
    .orderBy(asc(unitFamilyTbl.label), asc(unitTbl.key));

  return rowsToUnitFamilies(rows);
}
