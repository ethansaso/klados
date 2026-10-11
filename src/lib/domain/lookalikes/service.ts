import { db } from "../../../../db/client";
import { selectTaxonStatesByTaxonIds } from "../states/repo";
import { selectTaxonDtoById, selectTaxonDtosByIds } from "../taxa/repo";
import { selectLookalikeCandidateIds } from "./repo";
import { scoreLookalike } from "./scoring";
import type { LookalikeComparisonDetailDTO, TaxonLookalikeDTO } from "./types";
import { buildGroupedLookalikeStates } from "./util";

/** How many overlap-ranked candidates get the full slot comparison. */
const CANDIDATE_POOL_SIZE = 100;

export const getLookalikesForTaxon = async (
  taxonId: number,
  limit: number,
): Promise<TaxonLookalikeDTO[]> => {
  return db.transaction(async (tx) => {
    const candidateIds = await selectLookalikeCandidateIds(tx, {
      taxonId,
      limit: CANDIDATE_POOL_SIZE,
    });
    if (!candidateIds.length) return [];

    const statesById = await selectTaxonStatesByTaxonIds(tx, [
      taxonId,
      ...candidateIds,
    ]);
    const target = statesById[taxonId] ?? [];

    const ranked = candidateIds
      .map((id) => ({ id, ...scoreLookalike(target, statesById[id] ?? []) }))
      .sort(
        (x, y) =>
          y.score - x.score ||
          y.sharedSlotCount - x.sharedSlotCount ||
          x.id - y.id,
      )
      .slice(0, limit);

    const taxa = await selectTaxonDtosByIds(
      tx,
      ranked.map((r) => r.id),
    );
    const taxaById = new Map(taxa.map((t) => [t.id, t]));

    return ranked.flatMap(({ id, score, sharedSlotCount }) => {
      const t = taxaById.get(id);
      if (!t) return [];
      return [
        {
          id,
          rank: t.rank,
          acceptedName: t.acceptedName,
          preferredCommonName: t.preferredCommonName,
          media: t.media,
          score,
          sharedSlotCount,
        },
      ];
    });
  });
};

export const getLookalikeComparisonDetailForTaxa = async (args: {
  taxonId: number;
  lookalikeId: number;
}): Promise<LookalikeComparisonDetailDTO> => {
  return db.transaction(async (tx) => {
    const byTaxon = await selectTaxonStatesByTaxonIds(tx, [
      args.taxonId,
      args.lookalikeId,
    ]);

    const [aTaxon, bTaxon] = await Promise.all([
      selectTaxonDtoById(tx, args.taxonId),
      selectTaxonDtoById(tx, args.lookalikeId),
    ]);

    if (!aTaxon) throw new Error(`Taxon with ID ${args.taxonId} not found.`);
    if (!bTaxon)
      throw new Error(`Taxon with ID ${args.lookalikeId} not found.`);

    const aGroups = byTaxon[args.taxonId] ?? [];
    const bGroups = byTaxon[args.lookalikeId] ?? [];

    // No need to fetch characters separately - metadata is already on the states!
    const groupedStates = buildGroupedLookalikeStates({
      aGroups,
      bGroups,
    });

    return {
      a: aTaxon,
      b: bTaxon,
      groupedStates,
    };
  });
};
