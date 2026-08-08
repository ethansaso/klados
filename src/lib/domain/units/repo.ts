import { asc, eq, ilike, inArray, sql } from "drizzle-orm";
import { numericCharacterMeta as numMetaTbl } from "../../../../db/schema/glossary/characters";
import {
  unitFamily as unitFamilyTbl,
  unit as unitTbl,
} from "../../../../db/schema/glossary/units";
import { likeAnywhere } from "../../utils/sql/likeAnywhere";
import type { Transaction, TxOrDb } from "../../utils/types/transactionType";
import type { CharacterUnitRequirement, UnitDTO, UnitFamilyDTO } from "./types";

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
  tx: TxOrDb,
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

/**
 * The unit family each numeric character measures in, plus whether that family
 * has any units at all. Tosses non-numeric characters.
 */
export async function selectCharacterUnitRequirements(
  tx: TxOrDb,
  characterIds: number[],
): Promise<Map<number, CharacterUnitRequirement>> {
  if (!characterIds.length) return new Map();

  const rows = await tx
    .select({
      characterId: numMetaTbl.characterId,
      unitFamilyId: numMetaTbl.unitFamilyId,
      requiresUnit: sql<boolean>`exists (
        select 1 from ${unitTbl} where ${unitTbl.familyId} = ${numMetaTbl.unitFamilyId}
      )`,
    })
    .from(numMetaTbl)
    .where(inArray(numMetaTbl.characterId, characterIds));

  return new Map(
    rows.map((row) => [
      row.characterId,
      { unitFamilyId: row.unitFamilyId, requiresUnit: row.requiresUnit },
    ]),
  );
}
