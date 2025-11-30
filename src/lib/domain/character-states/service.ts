import { db } from "../../../db/client";
import {
  selectCharacterAndGroupMetaByCharacterIds,
  selectTaxonCharacterStatesByTaxonIds,
  TaxonCharacterStatesByTaxonId,
} from "./repo";
import {
  DisplayCharacterState,
  TaxonCharacterDisplayGroupDTO,
  TaxonCharacterStateDTO,
} from "./types";

/**
 * Fetch all categorical character states for a taxon.
 */
export async function getTaxonCharacterStates(args: {
  taxonId: number;
}): Promise<TaxonCharacterStateDTO[]> {
  const { taxonId } = args;

  const map = await db.transaction((tx) =>
    selectTaxonCharacterStatesByTaxonIds(tx, [taxonId])
  );

  return map[taxonId] ?? [];
}

/**
 * INTERNAL USE ONLY. Do not expose in public API.
 * Fetch categorical character states for many taxa at once.
 * Returns a map taxonId -> TaxonCharacterStateDTO[].
 */
export async function getTaxaCharacterStates(args: {
  taxonIds: number[];
}): Promise<TaxonCharacterStatesByTaxonId> {
  const { taxonIds } = args;

  if (!taxonIds.length) {
    return {};
  }

  return db.transaction(async (tx) => {
    return selectTaxonCharacterStatesByTaxonIds(tx, taxonIds);
  });
}

/**
 * Display-oriented DTOs for taxon character groups + characters.
 */
export async function getTaxonCharacterDisplayGroups(args: {
  taxonId: number;
}): Promise<TaxonCharacterDisplayGroupDTO[]> {
  const { taxonId } = args;

  // Get canonical states
  const states = await getTaxonCharacterStates({ taxonId });
  if (!states.length) return [];

  // Get unique character IDs
  const characterIds = Array.from(new Set(states.map((s) => s.characterId)));
  if (!characterIds.length) return [];

  // Get character + group meta
  const metaRows = await db.transaction((tx) =>
    selectCharacterAndGroupMetaByCharacterIds(tx, characterIds)
  );
  if (!metaRows.length) return [];

  // Build characterId index
  const stateByCharacterId = new Map(
    states.map<[number, DisplayCharacterState]>((s) => [
      s.characterId,
      {
        kind: s.kind,
        traitValues: s.traitValues,
      },
    ])
  );

  // Build final grouped DTOs
  const groupsMap = new Map<number, TaxonCharacterDisplayGroupDTO>();

  for (const row of metaRows) {
    let group = groupsMap.get(row.groupId);
    if (!group) {
      group = {
        id: row.groupId,
        label: row.groupLabel,
        description: row.groupDescription,
        characters: [],
      };
      groupsMap.set(row.groupId, group);
    }

    group.characters.push({
      id: row.characterId,
      label: row.characterLabel,
      description: row.characterDescription,
      state: stateByCharacterId.get(row.characterId) ?? null,
    });
  }

  return Array.from(groupsMap.values());
}
