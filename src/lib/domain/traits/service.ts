import { db } from "../../../../db/client";
import {
  countTraitsInSet,
  deleteSynonymSetIfEmpty,
  deleteTraitValueById,
  insertSynonymSet,
  insertTraitValueRow,
  moveTraitsBetweenSets,
  moveTraitToSet,
  selectAllTraitValuesByCharacters,
  selectSynonymSetSizes,
  selectTraitIdentityById,
  selectTraitValueDtoById,
  selectTraitValueDtosByIds,
  selectTraitValuesByCharacterPaginated,
  updateTraitValueRow,
} from "./repo";
import type { TraitValueDTO, TraitValuePaginatedResult } from "./types";
import type { UpdateTraitValueInput } from "./validation";

/** Deterministically chooses the larger of two sets to 'survive' a merge to reduce move operations. */
function pickKeepAndDrop(
  setA: number,
  sizeA: number,
  setB: number,
  sizeB: number,
): { keep: number; drop: number } {
  if (sizeA !== sizeB) {
    return sizeA > sizeB
      ? { keep: setA, drop: setB }
      : { keep: setB, drop: setA };
  }
  return setA < setB ? { keep: setA, drop: setB } : { keep: setB, drop: setA };
}

/**
 * Delete a trait value by id.
 * Returns { id } if deleted, null if the value does not exist.
 */
export async function deleteTraitValue(args: {
  id: number;
}): Promise<{ id: number } | null> {
  const { id } = args;

  return db.transaction(async (tx) => {
    const dto = await selectTraitValueDtoById(tx, id);
    if (!dto) return null;

    // Block delete if referenced by a state(s)
    if (dto.usageCount > 0) {
      throw new Error(
        `Cannot delete "${dto.label}" because it is used by ${dto.usageCount} taxon character state(s).`,
      );
    }

    const deleted = await deleteTraitValueById(tx, id);
    await deleteSynonymSetIfEmpty(tx, dto.synonymSetId);

    return deleted;
  });
}

/**
 * Fetch a single trait value by ID.
 * Returns null if not found.
 */
export async function getTraitValue(args: {
  id: number;
}): Promise<TraitValueDTO | null> {
  return db.transaction((tx) => selectTraitValueDtoById(tx, args.id));
}

/** Bulk fetch trait values by ID. */
export async function getTraitValuesByIds(
  ids: number[],
): Promise<TraitValueDTO[]> {
  if (!ids.length) {
    return [];
  }

  const dtos = await db.transaction(async (tx) => {
    return selectTraitValueDtosByIds(tx, ids);
  });

  return dtos;
}

/**
 * Create a trait value.
 * Will also create a single-member synonym set, unless a `synonymOfTraitId` is passed.
 */
export async function createTraitValue(args: {
  characterId: number;
  label: string;
  description?: string;
  hexCode?: string | null;
  synonymOfTraitId?: number;
}): Promise<TraitValueDTO> {
  const characterId = args.characterId;
  const label = args.label.trim();

  return db.transaction(async (tx) => {
    let synonymSetId: number;

    if (args.synonymOfTraitId !== undefined) {
      const sibling = await selectTraitIdentityById(tx, args.synonymOfTraitId);
      if (!sibling) {
        throw new Error("Synonym target not found.");
      }
      if (sibling.characterId !== characterId) {
        throw new Error("Synonym target must belong to the same character.");
      }
      synonymSetId = sibling.synonymSetId;
    } else {
      const set = await insertSynonymSet(tx, characterId);
      synonymSetId = set.id;
    }

    const inserted = await insertTraitValueRow(tx, {
      characterId,
      synonymSetId,
      label,
      description: args.description?.trim(),
      hexCode: args.hexCode,
    });

    if (!inserted) {
      throw new Error("Insert failed.");
    }

    const dto = await selectTraitValueDtoById(tx, inserted.id);
    if (!dto) {
      throw new Error("Inserted row not found.");
    }

    return dto;
  });
}

/**
 * Patch trait value's fields.
 * To modify synonym membership, see `linkTraitsAsSynonyms` / `unlinkTraitFromSynonyms`.
 */
export async function updateTraitValue(
  args: UpdateTraitValueInput,
): Promise<TraitValueDTO> {
  return db.transaction(async (tx) => {
    const cur = await selectTraitIdentityById(tx, args.id);
    if (!cur) throw new Error("Trait value not found.");
    if (cur.characterId !== args.characterId)
      throw new Error("Trait value character mismatch.");

    const updated = await updateTraitValueRow(tx, {
      id: args.id,
      characterId: args.characterId,
      label: args.label?.trim(),
      hexCode: args.hexCode,
      description:
        args.description === undefined ? undefined : args.description.trim(),
    });
    if (!updated) throw new Error("Update failed.");

    const dto = await selectTraitValueDtoById(tx, args.id);
    if (!dto) throw new Error("Updated row not found.");

    return dto;
  });
}

/**
 * Merge two traits into one synonym set.
 * Order does not matter -- see {@link pickKeepAndDrop}.
 */
export async function linkTraitsAsSynonyms(args: {
  traitIdA: number;
  traitIdB: number;
}): Promise<{ synonymSetId: number }> {
  return db.transaction(async (tx) => {
    const a = await selectTraitIdentityById(tx, args.traitIdA);
    const b = await selectTraitIdentityById(tx, args.traitIdB);

    if (!a || !b) throw new Error("Trait value not found.");
    if (a.characterId !== b.characterId) {
      throw new Error("Traits belong to different characters.");
    }
    // Cover linking a trait to itself
    if (a.synonymSetId === b.synonymSetId) {
      return { synonymSetId: a.synonymSetId };
    }

    const sizes = await selectSynonymSetSizes(tx, [
      a.synonymSetId,
      b.synonymSetId,
    ]);
    const { keep, drop } = pickKeepAndDrop(
      a.synonymSetId,
      sizes.get(a.synonymSetId) ?? 0,
      b.synonymSetId,
      sizes.get(b.synonymSetId) ?? 0,
    );

    await moveTraitsBetweenSets(tx, drop, keep);
    await deleteSynonymSetIfEmpty(tx, drop);

    return { synonymSetId: keep };
  });
}

/** Detach a trait from its synonyms by moving it into a fresh set of its own. */
export async function unlinkTraitFromSynonyms(args: {
  traitId: number;
}): Promise<{ synonymSetId: number }> {
  return db.transaction(async (tx) => {
    const trait = await selectTraitIdentityById(tx, args.traitId);
    if (!trait) throw new Error("Trait value not found.");

    // Early return if it's already alone
    if ((await countTraitsInSet(tx, trait.synonymSetId)) <= 1) {
      return { synonymSetId: trait.synonymSetId };
    }

    const set = await insertSynonymSet(tx, trait.characterId);
    await moveTraitToSet(tx, args.traitId, set.id);
    // Attempt cleanup -- other part(s) of transaction may have influenced set
    await deleteSynonymSetIfEmpty(tx, trait.synonymSetId);

    return { synonymSetId: set.id };
  });
}

/** List trait values for a character, paginated. */
export async function listTraitValuesByCharacter(args: {
  characterId: number;
  page: number;
  pageSize: number;
  q?: string;
}): Promise<TraitValuePaginatedResult> {
  return db.transaction(async (tx) => {
    return selectTraitValuesByCharacterPaginated(
      tx,
      args.characterId,
      args.page,
      args.pageSize,
      { q: args.q },
    );
  });
}

/**
 * List all trait values for a list of characters (unpaginated),
 * grouped by character ID.
 */
export async function listAllTraitValuesByCharacters(
  characterIds: number[],
): Promise<ReturnType<typeof selectAllTraitValuesByCharacters>> {
  return db.transaction(async (tx) => {
    return selectAllTraitValuesByCharacters(tx, characterIds);
  });
}
