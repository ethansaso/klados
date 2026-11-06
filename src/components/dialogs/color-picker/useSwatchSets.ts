import { useQueries } from "@tanstack/react-query";
import type { TraitValueDTO } from "../../../lib/domain/traits/types";
import { traitValuesQueryOptions } from "../../../lib/queries/traits";
import type { ColorPick } from "./types";

/** The list endpoint's largest page; a color's set is far smaller. */
const SET_PAGE_SIZE = 100;

/**
 * Reorganizes color labels from picks into a { hex: label[] } map.
 * ? Built to help fetch all hexes upfront for picks, so users don't see loading flashes.
 */
export function useSwatchSets(
  characterId: number,
  picks: ColorPick[],
): Map<string, TraitValueDTO[]> {
  const hexCodes = [
    ...new Set(
      picks.flatMap((pick) =>
        [...pick.suggestions, pick.swatch].map((swatch) => swatch.hexCode),
      ),
    ),
  ];
  const results = useQueries({
    queries: hexCodes.map((hexCode) =>
      traitValuesQueryOptions(characterId, 1, SET_PAGE_SIZE, { hexCode }),
    ),
  });
  return new Map(
    hexCodes.flatMap((hexCode, i) => {
      const items = results[i]?.data?.items;
      return items ? [[hexCode, items] as const] : [];
    }),
  );
}

/** Reorders a set's labels to put swatch label first. */
export function orderSetMembers(
  members: TraitValueDTO[],
  swatchLabel: string,
): TraitValueDTO[] {
  const own = members.find(
    (m) => m.label.toLowerCase() === swatchLabel.toLowerCase(),
  );
  return own ? [own, ...members.filter((m) => m !== own)] : members;
}

/** The label a pick will add: the chosen one, else the swatch's own. */
export function chosenMember(
  members: TraitValueDTO[],
  pick: ColorPick,
): TraitValueDTO | undefined {
  return (
    members.find((m) => m.id === pick.traitValueId) ??
    orderSetMembers(members, pick.swatch.label)[0]
  );
}
