import type { TaxonEditFormValues } from ".";
import type { TaxonCharacterStateDTO } from "../../../../../lib/domain/character-states/types";
import type { TaxonDetailDTO } from "../../../../../lib/domain/taxa/types";
import type { TaxonSourceDTO } from "../../../../../lib/domain/taxon-sources/types";
import type { TaxonSourceUpsertItem } from "../../../../../lib/domain/taxon-sources/validation";
import type { CharacterStateFormValue } from "./-characters/validation";

const seedSources = (rows: TaxonSourceDTO[]): TaxonSourceUpsertItem[] =>
  rows.map((r) => ({
    sourceId: r.sourceId,
    accessedAt: new Date(r.accessedAt),
    locator: r.locator ?? "",
    note: r.note ?? "",
  }));

const seedCharacterValues = (
  dtos: TaxonCharacterStateDTO[],
): CharacterStateFormValue[] => {
  return dtos.map((dto) => {
    switch (dto.kind) {
      case "categorical":
        return {
          kind: "categorical",
          characterId: dto.characterId,
          characterLabel: dto.characterLabel,
          groupId: dto.groupId,
          groupLabel: dto.groupLabel,
          traitValues: dto.traitValues.map((tv) => ({
            id: tv.id,
            label: tv.label,
            hexCode: tv.hexCode,
          })),
        };
      case "number":
        return {
          kind: "number",
          characterId: dto.characterId,
          characterLabel: dto.characterLabel,
          groupId: dto.groupId,
          groupLabel: dto.groupLabel,
          unit: dto.unit
            ? {
                id: dto.unit.id,
                symbol: dto.unit.symbol,
                scale: dto.unit.scale,
              }
            : null,
          siBaseValue: dto.siBaseValue,
        };
      case "range":
        return {
          kind: "range",
          characterId: dto.characterId,
          characterLabel: dto.characterLabel,
          groupId: dto.groupId,
          groupLabel: dto.groupLabel,
          unit: dto.unit
            ? {
                id: dto.unit.id,
                symbol: dto.unit.symbol,
                scale: dto.unit.scale,
              }
            : null,
          siBaseMin: dto.siBaseMin,
          siBaseMax: dto.siBaseMax,
        };
    }
  });
};

export const seedTaxonEditState = (
  taxon: TaxonDetailDTO,
  characterValues: TaxonCharacterStateDTO[],
  sources: TaxonSourceDTO[],
): TaxonEditFormValues => ({
  parentId: taxon.ancestors?.[taxon.ancestors.length - 1]?.id ?? null,
  rank: taxon.rank,
  sourceGbifId: taxon.sourceGbifId,
  sourceInatId: taxon.sourceInatId,
  media: taxon.media,
  notes: taxon.notes,
  names: taxon.names,
  characters: seedCharacterValues(characterValues),
  sources: seedSources(sources),
});
