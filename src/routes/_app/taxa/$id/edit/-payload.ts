import type { FieldNamesMarkedBoolean } from "react-hook-form";
import type { TaxonEditFormValues } from ".";
import type { CharacterByFeatureUpdate } from "../../../../../lib/domain/states/validation";
import type { UpdateTaxonInput } from "../../../../../lib/domain/taxa/validation";

export type TaxonUpdatePayload = Required<Omit<UpdateTaxonInput, "id">>;
export type DirtyTaxonFields = Partial<
  Readonly<FieldNamesMarkedBoolean<TaxonEditFormValues>>
>;

export function toUpdatePayload(
  values: TaxonEditFormValues,
): TaxonUpdatePayload {
  return {
    parentId: values.parentId,
    rank: values.rank,
    sourceGbifId: values.sourceGbifId,
    sourceInatId: values.sourceInatId,
    ecology: values.ecology,
    notes: values.notes,
    names: values.names.map(({ value, locale, isPreferred }) => ({
      value,
      locale,
      isPreferred,
    })),
    states: toServerCharacterValues(values.states),
    sources: values.sources,
    mediaIds: values.media.map((m) => m.id),
  };
}

/**
 * Picks the payload sections whose form fields are dirty. The server logs each
 * section it receives as edited, so clean ones must be left out.
 */
export function pickDirtySections(
  payload: TaxonUpdatePayload,
  dirtyFields: DirtyTaxonFields,
): Partial<TaxonUpdatePayload> {
  // RHF drops clean fields from `dirtyFields`, so any key present is dirty
  return Object.fromEntries(
    Object.keys(dirtyFields).map((field) => {
      const key = (
        field === "media" ? "mediaIds" : field
      ) as keyof TaxonUpdatePayload;
      return [key, payload[key]];
    }),
  );
}

function toServerCharacterValues(
  values: TaxonEditFormValues["states"],
): CharacterByFeatureUpdate {
  return values.map((feature) => ({
    featureId: feature.featureId,
    notes: feature.notes,
    presence: feature.presence,
    characters: feature.characters.map((v) => {
      switch (v.kind) {
        case "categorical":
          return {
            kind: "categorical",
            characterId: v.characterId,
            traitValueId: v.trait.id,
            modifierIds: v.modifiers.map((m) => m.id),
          };

        case "number":
          return {
            kind: "number",
            characterId: v.characterId,
            unitId: v.unit?.id,
            siBaseValue: v.siBaseValue,
            modifierIds: v.modifiers.map((m) => m.id),
          };

        case "range":
          return {
            kind: "range",
            characterId: v.characterId,
            unitId: v.unit?.id,
            siBaseMin: v.siBaseMin,
            siBaseMax: v.siBaseMax,
            modifierIds: v.modifiers.map((m) => m.id),
          };
      }
    }),
  }));
}
