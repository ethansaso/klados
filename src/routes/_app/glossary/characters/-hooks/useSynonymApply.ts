import { useCallback, useState } from "react";
import type { MediaDTO } from "../../../../../lib/domain/media/types";
import type { TraitValueDTO } from "../../../../../lib/domain/traits/types";
import type { UpdateTraitValueInput } from "../../../../../lib/domain/traits/validation";
import { useSynonymSetMembers } from "./useSynonymSetMembers";

/** Metadata a trait can copy onto its synonyms. */
export type SynonymField = "description" | "media";
export type SynonymApply = ReturnType<typeof useSynonymApply>;
export type SynonymFieldPair = readonly [traitId: number, field: SynonymField];

/** Why a trait can't be applied to its synonyms, or null if it can. */
export function applyToSynonymsBlocker(value: TraitValueDTO): string | null {
  if (!value.synonyms.length) return "Not in a synonym set";
  if (!sharedFieldsOf(value.description, value.media).length) {
    return "No description or image to apply";
  }
  return null;
}

/** Fields the trait has values for. Blank ones never apply, so synonyms can't be cleared. */
function sharedFieldsOf(
  description: string,
  media: MediaDTO | null,
): SynonymField[] {
  const fields: SynonymField[] = [];
  if (description.trim()) fields.push("description");
  if (media) fields.push("media");
  return fields;
}

function pairKey(traitId: number, field: SynonymField): string {
  return `${traitId}:${field}`;
}

/**
 * Review state for applying a saved trait to its synonyms: the set's other
 * members, and which of their fields to overwrite. Everything starts checked.
 */
export function useSynonymApply(source: TraitValueDTO) {
  // Unchecked pairs, so members start checked as soon as they load
  const [excluded, setExcluded] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const { members, isLoading, error } = useSynonymSetMembers(
    source.characterId,
    source.synonymSetId,
    source.id,
  );
  const fields = sharedFieldsOf(source.description, source.media);
  const isChecked = (traitId: number, field: SynonymField) =>
    !excluded.has(pairKey(traitId, field));

  // One patch per synonym with anything checked, carrying the source's values
  const patches: UpdateTraitValueInput[] = members.flatMap((m) => {
    const checked = fields.filter((f) => isChecked(m.id, f));
    if (!checked.length) return [];
    return [
      {
        id: m.id,
        characterId: m.characterId,
        ...(checked.includes("description") && {
          description: source.description,
        }),
        ...(checked.includes("media") && { mediaId: source.media?.id }),
      },
    ];
  });

  const setChecked = useCallback(
    (pairs: readonly SynonymFieldPair[], checked: boolean) =>
      setExcluded((prev) => {
        const next = new Set(prev);
        for (const [traitId, field] of pairs) {
          if (checked) next.delete(pairKey(traitId, field));
          else next.add(pairKey(traitId, field));
        }
        return next;
      }),
    [],
  );

  return {
    members,
    isLoading,
    error,
    fields,
    patches,
    isChecked,
    setChecked,
  };
}
