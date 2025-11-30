import { eq, inArray } from "drizzle-orm";
import {
  taxonCharacterStateCategorical as catStateTbl,
  character as charsTbl,
  categoricalTraitValue as traitValTbl,
} from "../../../db/schema/schema";
import { Transaction } from "../../utils/transactionType";
import { TaxonCharacterStateDTO } from "./types";

export type TaxonCharacterStatesByTaxonId = Record<
  number,
  TaxonCharacterStateDTO[]
>;

/**
 * Load categorical character states for many taxa at once.
 * Returns a map taxonId -> TaxonCharacterStateDTO[].
 */
export async function selectTaxonCharacterStatesByTaxonIds(
  tx: Transaction,
  taxonIds: number[]
): Promise<TaxonCharacterStatesByTaxonId> {
  if (!taxonIds.length) {
    return {};
  }

  const rows = await tx
    .select({
      taxonId: catStateTbl.taxonId,
      characterId: catStateTbl.characterId,
      groupId: charsTbl.groupId,
      traitValueId: catStateTbl.traitValueId,
      traitValueLabel: traitValTbl.label,
      traitValueHexCode: traitValTbl.hexCode,
    })
    .from(catStateTbl)
    .innerJoin(charsTbl, eq(charsTbl.id, catStateTbl.characterId))
    .innerJoin(traitValTbl, eq(traitValTbl.id, catStateTbl.traitValueId))
    .where(inArray(catStateTbl.taxonId, taxonIds));

  if (!rows.length) {
    return {};
  }

  // taxonId -> (characterId -> state)
  const byTaxon = new Map<number, Map<number, TaxonCharacterStateDTO>>();

  for (const row of rows) {
    let byCharacter = byTaxon.get(row.taxonId);
    if (!byCharacter) {
      byCharacter = new Map<number, TaxonCharacterStateDTO>();
      byTaxon.set(row.taxonId, byCharacter);
    }

    let state = byCharacter.get(row.characterId);
    if (!state) {
      state = {
        kind: "categorical",
        characterId: row.characterId,
        groupId: row.groupId,
        traitValues: [],
      };
      byCharacter.set(row.characterId, state);
    }

    state.traitValues.push({
      id: row.traitValueId,
      label: row.traitValueLabel,
      ...(row.traitValueHexCode ? { hexCode: row.traitValueHexCode } : {}),
    });
  }

  const result: TaxonCharacterStatesByTaxonId = {};

  for (const [taxonId, byCharacter] of byTaxon) {
    result[taxonId] = Array.from(byCharacter.values());
  }

  return result;
}
