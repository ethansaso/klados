import { eq } from "drizzle-orm";
import {
  taxonCharacterStateCategorical as catStateTbl,
  character as charsTbl,
  categoricalTraitValue as traitValTbl,
} from "../../../db/schema/schema";
import { Transaction } from "../../utils/transactionType";
import { TaxonCharacterStateDTO } from "./types";

/**
 * Load categorical character states for a taxon and aggregate them into
 * TaxonCharacterStateDTOs (one per character).
 */
export async function selectTaxonCharacterStatesByTaxonId(
  tx: Transaction,
  taxonId: number
): Promise<TaxonCharacterStateDTO[]> {
  // One row per (taxon, character, traitValue)
  const rows = await tx
    .select({
      characterId: catStateTbl.characterId,
      groupId: charsTbl.groupId,
      traitValueId: catStateTbl.traitValueId,
      traitValueLabel: traitValTbl.label,
    })
    .from(catStateTbl)
    .innerJoin(charsTbl, eq(charsTbl.id, catStateTbl.characterId))
    .innerJoin(traitValTbl, eq(traitValTbl.id, catStateTbl.traitValueId))
    .where(eq(catStateTbl.taxonId, taxonId));

  if (!rows.length) return [];

  const byCharacter = new Map<number, TaxonCharacterStateDTO>();

  for (const row of rows) {
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
    });
  }

  return Array.from(byCharacter.values());
}
