import { inArray } from "drizzle-orm";
import { db } from "../../../../db/client";
import { unit } from "../../../../db/schema/glossary/units";
import {
  categoricalTraitValue,
  character,
  feature,
} from "../../../../db/schema/schema";

export type FilterLabelMaps = {
  features: Map<number, string>;
  characters: Map<number, string>;
  /** Carries owning character, so value can be checked against the token */
  traitValues: Map<number, { label: string; characterId: number }>;
  units: Map<number, string>;
};

const toMap = (rows: { id: number; label: string }[]) =>
  new Map(rows.map((row) => [row.id, row.label]));

/** Labels for every id a set of filter tokens references, in one round trip. */
export async function selectCharacterFilterLabels(ids: {
  featureIds: number[];
  characterIds: number[];
  traitValueIds: number[];
  unitIds: number[];
}): Promise<FilterLabelMaps> {
  const [features, characters, traitValues, units] = await Promise.all([
    ids.featureIds.length
      ? db
          .select({ id: feature.id, label: feature.label })
          .from(feature)
          .where(inArray(feature.id, ids.featureIds))
      : [],
    ids.characterIds.length
      ? db
          .select({ id: character.id, label: character.label })
          .from(character)
          .where(inArray(character.id, ids.characterIds))
      : [],
    ids.traitValueIds.length
      ? db
          .select({
            id: categoricalTraitValue.id,
            label: categoricalTraitValue.label,
            characterId: categoricalTraitValue.characterId,
          })
          .from(categoricalTraitValue)
          .where(inArray(categoricalTraitValue.id, ids.traitValueIds))
      : [],
    ids.unitIds.length
      ? db
          .select({ id: unit.id, label: unit.symbol })
          .from(unit)
          .where(inArray(unit.id, ids.unitIds))
      : [],
  ]);

  return {
    features: toMap(features),
    characters: toMap(characters),
    traitValues: new Map(
      traitValues.map((row) => [
        row.id,
        { label: row.label, characterId: row.characterId },
      ]),
    ),
    units: toMap(units),
  };
}
