import { eq, inArray } from "drizzle-orm";
import {
  taxonCharacterStateCategorical as catStateTbl,
  categoricalTraitValue as catValTbl,
  character as charsTbl,
  characterGroup as groupsTbl,
} from "../../../db/schema/schema";
import { Transaction } from "../../utils/transactionType";
import { TaxonCharacterStateDTO } from "./types";

export type TaxonCharacterStatesByTaxonId = Record<
  number,
  TaxonCharacterStateDTO[]
>;

type CharacterWithGroupMetaRow = {
  characterId: number;
  characterLabel: string;
  characterDescription: string;
  groupId: number;
  groupLabel: string;
  groupDescription: string;
};

/**
 * Load categorical character states for at least one taxon.
 * Returns a map taxonId -> TaxonCharacterStateDTO[].
 *
 * For traitValues:
 * - label comes from the **stored** value (alias or canonical),
 * - hexCode comes from the **canonical** value (or itself if canonical).
 */
export async function selectTaxonCharacterStatesByTaxonIds(
  tx: Transaction,
  taxonIds: number[]
): Promise<TaxonCharacterStatesByTaxonId> {
  if (!taxonIds.length) {
    return {};
  }

  // Initial load of all categorical states for the given taxa
  const rows = await tx
    .select({
      taxonId: catStateTbl.taxonId,
      characterId: catStateTbl.characterId,
      groupId: charsTbl.groupId,
      traitValueId: catStateTbl.traitValueId,
      traitValueLabel: catValTbl.label,
      isCanonical: catValTbl.isCanonical,
      canonicalValueId: catValTbl.canonicalValueId,
    })
    .from(catStateTbl)
    .innerJoin(charsTbl, eq(charsTbl.id, catStateTbl.characterId))
    .innerJoin(catValTbl, eq(catValTbl.id, catStateTbl.traitValueId))
    .where(inArray(catStateTbl.taxonId, taxonIds));

  if (!rows.length) {
    return {};
  }

  // Find required hex codes for canonical values
  const canonicalIds = Array.from(
    new Set(
      rows.map((row) =>
        row.isCanonical
          ? row.traitValueId
          : (row.canonicalValueId ?? row.traitValueId)
      )
    )
  );

  // Load canonical rows and build a map id -> hexCode
  let hexByCanonicalId = new Map<number, string | null>();
  if (canonicalIds.length > 0) {
    const canonicalRows = await tx
      .select({
        id: catValTbl.id,
        hexCode: catValTbl.hexCode,
      })
      .from(catValTbl)
      .where(inArray(catValTbl.id, canonicalIds));

    hexByCanonicalId = new Map(canonicalRows.map((r) => [r.id, r.hexCode]));
  }

  // Build taxonId -> (characterId -> state) map
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

    const canonicalId = row.isCanonical
      ? row.traitValueId
      : (row.canonicalValueId ?? row.traitValueId);

    const hexCode =
      canonicalId != null
        ? (hexByCanonicalId.get(canonicalId) ?? undefined)
        : undefined;

    state.traitValues.push({
      id: row.traitValueId, // stored value (alias or canonical)
      label: row.traitValueLabel, // label from stored value
      ...(hexCode ? { hexCode } : {}), // color from canonical (if extant)
    });
  }

  // Convert map back to plain record
  const result: TaxonCharacterStatesByTaxonId = {};

  for (const [taxonId, byCharacter] of byTaxon) {
    result[taxonId] = Array.from(byCharacter.values());
  }

  return result;
}

export async function selectCharacterAndGroupMetaByCharacterIds(
  tx: Transaction,
  characterIds: number[]
): Promise<CharacterWithGroupMetaRow[]> {
  if (!characterIds.length) return [];

  const rows = await tx
    .select({
      characterId: charsTbl.id,
      characterLabel: charsTbl.label,
      characterDescription: charsTbl.description,
      groupId: groupsTbl.id,
      groupLabel: groupsTbl.label,
      groupDescription: groupsTbl.description,
    })
    .from(charsTbl)
    .innerJoin(groupsTbl, eq(groupsTbl.id, charsTbl.groupId))
    .where(inArray(charsTbl.id, characterIds));

  return rows;
}
