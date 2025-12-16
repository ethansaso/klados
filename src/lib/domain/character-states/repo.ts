import { eq, inArray } from "drizzle-orm";
import {
  categoricalCharacterMeta as catMetaTbl,
  taxonCharacterStateCategorical as catStateTbl,
  categoricalTraitValue as catValTbl,
  character as charsTbl,
  characterGroup as groupsTbl,
} from "../../../db/schema/schema";
import { Transaction } from "../../utils/transactionType";
import { TaxonCharacterStateDTO } from "./types";
import { CategoricalCharacterUpdate } from "./validation";

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
      id: row.traitValueId, // stored id (alias or canonical)
      canonicalId: canonicalId, // canonical id
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

export async function replaceCategoricalStatesForTaxon(
  tx: Transaction,
  taxonId: number,
  updates: CategoricalCharacterUpdate[]
): Promise<void> {
  // Clear if empty
  if (updates.length === 0) {
    await tx.delete(catStateTbl).where(eq(catStateTbl.taxonId, taxonId));
    return;
  }

  // Normalize: dedupe by characterId, dedupe traitValueIds
  const byCharacter = new Map<number, Set<number>>();
  for (const u of updates) {
    const set = byCharacter.get(u.characterId) ?? new Set<number>();
    for (const id of u.traitValueIds) set.add(id);
    byCharacter.set(u.characterId, set);
  }

  const normalized = Array.from(byCharacter.entries()).map(
    ([characterId, ids]) => ({
      characterId,
      traitValueIds: Array.from(ids),
    })
  );

  const characterIds = normalized.map((c) => c.characterId);

  const metas = await tx
    .select({
      characterId: catMetaTbl.characterId,
      traitSetId: catMetaTbl.traitSetId,
      isMultiSelect: catMetaTbl.isMultiSelect,
    })
    .from(catMetaTbl)
    .where(inArray(catMetaTbl.characterId, characterIds));

  const metaByCharacter = new Map(metas.map((m) => [m.characterId, m]));

  for (const c of normalized) {
    if (!metaByCharacter.has(c.characterId)) {
      throw new Error(
        `Character ${c.characterId} is not categorical or does not exist.`
      );
    }
  }

  const allTraitValueIds = Array.from(
    new Set(normalized.flatMap((c) => c.traitValueIds))
  );

  if (allTraitValueIds.length === 0) {
    await tx.delete(catStateTbl).where(eq(catStateTbl.taxonId, taxonId));
    return;
  }

  const traitValues = await tx
    .select({
      id: catValTbl.id,
      setId: catValTbl.setId,
    })
    .from(catValTbl)
    .where(inArray(catValTbl.id, allTraitValueIds));

  const traitValueById = new Map(traitValues.map((v) => [v.id, v]));

  const rowsToInsert: Array<{
    taxonId: number;
    characterId: number;
    traitValueId: number;
  }> = [];

  for (const c of normalized) {
    const meta = metaByCharacter.get(c.characterId)!;

    if (!meta.isMultiSelect && c.traitValueIds.length > 1) {
      throw new Error(
        `Character ${c.characterId} does not allow multiple states.`
      );
    }

    for (const traitValueId of c.traitValueIds) {
      const tv = traitValueById.get(traitValueId);
      if (!tv) throw new Error(`Unknown trait value id ${traitValueId}.`);
      if (tv.setId !== meta.traitSetId) {
        throw new Error(
          `Trait value ${traitValueId} does not belong to character ${c.characterId}.`
        );
      }
      rowsToInsert.push({ taxonId, characterId: c.characterId, traitValueId });
    }
  }

  await tx.delete(catStateTbl).where(eq(catStateTbl.taxonId, taxonId));
  if (rowsToInsert.length) {
    await tx.insert(catStateTbl).values(rowsToInsert);
  }
}
