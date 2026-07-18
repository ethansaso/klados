import { v4 as uuidv4 } from "uuid";
import type { TaxonEditFormValues } from ".";
import type {
  CategoricalStateDTO,
  FeatureStateDTO,
  NumberStateDTO,
  RangeStateDTO,
} from "../../../../../lib/domain/states/types";
import type { TaxonDetailDTO } from "../../../../../lib/domain/taxa/types";
import type { TaxonSourceDTO } from "../../../../../lib/domain/taxon-sources/types";
import type { TaxonSourceUpsertItem } from "../../../../../lib/domain/taxon-sources/validation";
import type {
  CharacterStateFormValue,
  GroupedCharacterFormValue,
} from "./-characters/validation";

const seedSources = (rows: TaxonSourceDTO[]): TaxonSourceUpsertItem[] =>
  rows.map((r) => ({
    sourceId: r.sourceId,
    accessedAt: new Date(r.accessedAt),
    locator: r.locator ?? "",
    note: r.note ?? "",
  }));

function seedModifier(m: CategoricalStateDTO["modifiers"][number]) {
  return {
    id: m.id,
    value: m.value,
    affixType: m.affixType,
    groupId: m.groupId,
    groupLabel: m.groupLabel,
  };
}

function seedCategoricalState(
  dto: CategoricalStateDTO,
): CharacterStateFormValue {
  return {
    kind: "categorical",
    characterId: dto.characterId,
    characterLabel: dto.characterLabel,
    trait: {
      id: dto.trait.id,
      label: dto.trait.label,
      hexCode: dto.trait.hexCode,
    },
    modifiers: dto.modifiers.map(seedModifier),
  };
}

function seedNumericState(
  dto: NumberStateDTO | RangeStateDTO,
): CharacterStateFormValue {
  const shared = {
    characterId: dto.characterId,
    characterLabel: dto.characterLabel,
    unit: dto.unit
      ? { id: dto.unit.id, symbol: dto.unit.symbol, scale: dto.unit.scale }
      : null,
    modifiers: dto.modifiers.map(seedModifier),
  };
  return dto.kind === "number"
    ? { kind: "number", ...shared, siBaseValue: dto.siBaseValue }
    : {
        kind: "range",
        ...shared,
        siBaseMin: dto.siBaseMin,
        siBaseMax: dto.siBaseMax,
      };
}

function seedFeatureStates(
  states: FeatureStateDTO["states"],
): CharacterStateFormValue[] {
  return states.map((s) =>
    s.kind === "categorical" ? seedCategoricalState(s) : seedNumericState(s),
  );
}

const seedCharacterGroups = (
  features: FeatureStateDTO[],
): GroupedCharacterFormValue =>
  features.map((feature) => ({
    featureId: feature.featureId,
    featureLabel: feature.featureLabel,
    notes: feature.notes,
    characters: seedFeatureStates(feature.states),
  }));

const seedNames = (names: TaxonDetailDTO["names"]) => {
  return names.map((name) => ({
    ...name,
    _formId: uuidv4(),
  }));
};

export const seedTaxonEditState = (
  taxon: TaxonDetailDTO,
  characterGroups: FeatureStateDTO[],
  sources: TaxonSourceDTO[],
): TaxonEditFormValues => ({
  parentId: taxon.ancestors?.[taxon.ancestors.length - 1]?.id ?? null,
  rank: taxon.rank,
  sourceGbifId: taxon.sourceGbifId,
  sourceInatId: taxon.sourceInatId,
  media: taxon.media,
  ecology: taxon.ecology,
  notes: taxon.notes,
  names: seedNames(taxon.names),
  states: seedCharacterGroups(characterGroups),
  sources: seedSources(sources),
});
