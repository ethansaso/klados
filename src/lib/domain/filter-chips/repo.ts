import { inArray } from "drizzle-orm";
import { db } from "../../../../db/client";
import { unit } from "../../../../db/schema/glossary/units";
import {
  categoricalTraitValue,
  character,
  feature,
} from "../../../../db/schema/schema";
import { selectCharacterUnitRequirements } from "../units/repo";
import type { CharacterUnitRequirement } from "../units/types";

export type FilterLabelMaps = {
  /** Absent for non-numeric characters; see selectCharacterUnitRequirements. */
  unitRequirements: Map<number, CharacterUnitRequirement>;
  features: Map<number, string>;
  characters: Map<number, string>;
  /** Carries owning character, so value can be checked against the token */
  traitValues: Map<number, { label: string; characterId: number }>;
  units: Map<number, { symbol: string; familyId: number }>;
};

const toMap = (rows: { id: number; label: string }[]) =>
  new Map(rows.map((row) => [row.id, row.label]));

/** Labels for every id a set of filter tokens references, in one round trip. */
export async function selectFilterLabels(ids: {
  featureIds: number[];
  characterIds: number[];
  numericCharacterIds: number[];
  traitValueIds: number[];
  unitIds: number[];
}): Promise<FilterLabelMaps> {
  const [features, characters, traitValues, units, unitRequirements] =
    await Promise.all([
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
          .select({ id: unit.id, symbol: unit.symbol, familyId: unit.familyId })
          .from(unit)
          .where(inArray(unit.id, ids.unitIds))
      : [],
    selectCharacterUnitRequirements(db, ids.numericCharacterIds),
  ]);

  return {
    unitRequirements,
    features: toMap(features),
    characters: toMap(characters),
    traitValues: new Map(
      traitValues.map((row) => [
        row.id,
        { label: row.label, characterId: row.characterId },
      ]),
    ),
    units: new Map(
      units.map((row) => [row.id, { symbol: row.symbol, familyId: row.familyId }]),
    ),
  };
}
