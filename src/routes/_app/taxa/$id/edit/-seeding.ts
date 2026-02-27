import { v4 as uuidv4 } from "uuid";
import type { TaxonEditFormValues } from ".";
import type {
  CharacterStateDTO,
  FeatureStateDTO,
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

const seedCharacterState = (
  dto: CharacterStateDTO,
): CharacterStateFormValue => {
  switch (dto.kind) {
    case "categorical":
      return {
        kind: "categorical",
        characterId: dto.characterId,
        characterLabel: dto.characterLabel,
        traitValues: dto.traitValues.map((tv) => ({
          id: tv.id,
          label: tv.label,
          hexCode: tv.hexCode,
          modifiers: tv.modifiers.map((m) => ({
            id: m.id,
            value: m.value,
            affixType: m.affixType,
            groupId: m.groupId,
            groupLabel: m.groupLabel,
          })),
        })),
      };

    case "number":
      return {
        kind: "number",
        characterId: dto.characterId,
        characterLabel: dto.characterLabel,
        unit: dto.unit
          ? {
              id: dto.unit.id,
              symbol: dto.unit.symbol,
              scale: dto.unit.scale,
            }
          : null,
        siBaseValue: dto.siBaseValue,
        modifiers: dto.modifiers.map((m) => ({
          id: m.id,
          value: m.value,
          affixType: m.affixType,
          groupId: m.groupId,
          groupLabel: m.groupLabel,
        })),
      };

    case "range":
      return {
        kind: "range",
        characterId: dto.characterId,
        characterLabel: dto.characterLabel,
        unit: dto.unit
          ? {
              id: dto.unit.id,
              symbol: dto.unit.symbol,
              scale: dto.unit.scale,
            }
          : null,
        siBaseMin: dto.siBaseMin,
        siBaseMax: dto.siBaseMax,
        modifiers: dto.modifiers.map((m) => ({
          id: m.id,
          value: m.value,
          affixType: m.affixType,
          groupId: m.groupId,
          groupLabel: m.groupLabel,
        })),
      };
  }
};

const seedCharacterGroups = (
  features: FeatureStateDTO[],
): GroupedCharacterFormValue =>
  features.map((feature) => ({
    featureId: feature.featureId,
    featureLabel: feature.featureLabel,
    characters: feature.states.map(seedCharacterState),
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
  notes: taxon.notes,
  names: seedNames(taxon.names),
  states: seedCharacterGroups(characterGroups),
  sources: seedSources(sources),
});
