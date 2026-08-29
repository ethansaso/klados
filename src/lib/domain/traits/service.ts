import { db } from "../../../../db/client";
import { buildFuzzyQuery, computeFuzzyScore } from "../../utils/sql/fuzzyLabel";
import type { Transaction } from "../../utils/types/transactionType";
import {
  countTraitsInSet,
  deleteSynonymSetIfEmpty,
  deleteTraitValueById,
  insertSynonymSet,
  insertTraitValueRow,
  moveTraitToSet,
  selectAllTraitValuesByCharacters,
  selectSynonymCandidateRows,
  selectTraitIdentityById,
  selectTraitValueDtoById,
  selectTraitValueDtosByIds,
  selectTraitValuesByCharacterPaginated,
  updateTraitValueRow,
} from "./repo";
import type {
  SynonymCandidateDTO,
  TraitValueDTO,
  TraitValuePaginatedResult,
} from "./types";
import type {
  CreateTraitValueInput,
  ListSynonymCandidatesInput,
  UnlinkTraitFromSynonymsInput,
  UpdateTraitValueInput,
} from "./validation";

/** Deterministically chooses the larger of two sets to 'survive' a merge to reduce move operations. */
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
export async function createTraitValue(
  args: CreateTraitValueInput,
): Promise<TraitValueDTO> {
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
      mediaId: args.mediaId,
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
 * Patch a trait value's fields and, optionally, its synonym membership.
 * Setting `null` for `synonymOfTraitId` separates the trait into a set of its own.
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
      mediaId: args.mediaId,
    });
    if (!updated) throw new Error("Update failed.");

    if (args.synonymOfTraitId !== undefined) {
      if (args.synonymOfTraitId === null) {
        await unlinkTraitFromSynonymsTx(tx, args.id);
      } else {
        await moveTraitIntoSetOfTx(tx, args.id, args.synonymOfTraitId);
      }
    }

    const dto = await selectTraitValueDtoById(tx, args.id);
    if (!dto) throw new Error("Updated row not found.");

    return dto;
  });
}

/**
 * Move one trait into the set that `targetTraitId` belongs to.
 * Does not merge sets.
 */
async function moveTraitIntoSetOfTx(
  tx: Transaction,
  traitId: number,
  targetTraitId: number,
): Promise<{ synonymSetId: number }> {
  const trait = await selectTraitIdentityById(tx, traitId);
  const target = await selectTraitIdentityById(tx, targetTraitId);

  if (!trait || !target) throw new Error("Trait value not found.");
  if (trait.characterId !== target.characterId) {
    throw new Error("Traits belong to different characters.");
  }
  // Covers naming the trait itself, or any of its existing synonyms
  if (trait.synonymSetId === target.synonymSetId) {
    return { synonymSetId: trait.synonymSetId };
  }

  const vacated = trait.synonymSetId;
  await moveTraitToSet(tx, traitId, target.synonymSetId);
  // The trait may have been the only member of the set it left
  await deleteSynonymSetIfEmpty(tx, vacated);

  return { synonymSetId: target.synonymSetId };
}

/** Detach a trait from its synonyms by moving it into a fresh set of its own. */
async function unlinkTraitFromSynonymsTx(
  tx: Transaction,
  traitId: number,
): Promise<{ synonymSetId: number }> {
  const trait = await selectTraitIdentityById(tx, traitId);
  if (!trait) throw new Error("Trait value not found.");

  // Early return if it's already alone
  if ((await countTraitsInSet(tx, trait.synonymSetId)) <= 1) {
    return { synonymSetId: trait.synonymSetId };
  }

  const set = await insertSynonymSet(tx, trait.characterId);
  await moveTraitToSet(tx, traitId, set.id);
  // Attempt cleanup -- other part(s) of transaction may have influenced set
  await deleteSynonymSetIfEmpty(tx, trait.synonymSetId);

  return { synonymSetId: set.id };
}

export async function unlinkTraitFromSynonyms(
  args: UnlinkTraitFromSynonymsInput,
): Promise<{ synonymSetId: number }> {
  return db.transaction((tx) => unlinkTraitFromSynonymsTx(tx, args.traitId));
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

/**
 * Synonym sets ranked by how well their best label matches `q`.
 *
 * Ranking and collapsing are applied here (not in the repo layer)
 * because trait sets / synonym sets are generally small & best to limit
 * by set rather than label.
 */
export async function listSynonymCandidates(
  args: ListSynonymCandidatesInput,
): Promise<SynonymCandidateDTO[]> {
  const { characterId, excludeTraitId, q, limit } = args;

  return db.transaction(async (tx) => {
    const fq = q?.trim() ? buildFuzzyQuery(q) : null;

    const rows = await selectSynonymCandidateRows(tx, {
      characterId,
      excludeTraitId,
      fq,
    });

    const bySet = new Map<
      number,
      { labels: { id: number; label: string; score: number }[] }
    >();

    for (const row of rows) {
      const score = fq
        ? computeFuzzyScore(row.label.toLowerCase(), fq, row.similarity ?? 0)
        : 0;
      const entry = bySet.get(row.synonymSetId) ?? { labels: [] };
      entry.labels.push({ id: row.id, label: row.label, score });
      bySet.set(row.synonymSetId, entry);
    }

    const candidates = [...bySet.entries()].flatMap(
      ([synonymSetId, { labels }]) => {
        // Best match heads the set; the rest stay alphabetical behind it
        labels.sort((a, b) =>
          b.score !== a.score
            ? b.score - a.score
            : a.label.localeCompare(b.label),
        );

        const [head, ...rest] = labels;
        if (!head) return [];

        return [
          {
            synonymSetId,
            headTraitId: head.id,
            headLabel: head.label,
            headScore: head.score,
            labels: [head.label, ...rest.map((l) => l.label)],
          },
        ];
      },
    );

    candidates.sort((a, b) =>
      b.headScore !== a.headScore
        ? b.headScore - a.headScore
        : a.headLabel.localeCompare(b.headLabel),
    );

    return candidates
      .slice(0, limit)
      .map(({ synonymSetId, headTraitId, labels }) => ({
        synonymSetId,
        headTraitId,
        labels,
      }));
  });
}
