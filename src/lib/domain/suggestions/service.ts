import { buildFuzzyQuery, rankByFuzzyScore } from "../../utils/sql/fuzzyLabel";
import type { UnitDTO } from "../units/types";
import {
  normalizeUnitToken,
  parseNumericQuery,
  type ParsedNumeric,
} from "./numericParsing";
import {
  getUnitsForFamilies,
  queryAllModifiersByUsage,
  queryCategoricalSuggestionRows,
  queryFeatureSuggestionRows,
  queryModifierSuggestionRows,
  queryNumericCharacterMetas,
  resolveUnitFromToken,
  type NumericCharacterMetaRow,
} from "./repo";
import type {
  CategoricalValueSuggestion,
  FeatureSuggestion,
  ModifierSuggestion,
  NumericRangeSuggestion,
  NumericSingleSuggestion,
  TraitSuggestion,
} from "./types";

/**
 * Determine which unit(s) to expand for a numeric meta row, given an optional
 * already-resolved unit from the query string.
 *
 * Returns one of:
 *  - `{ matched: UnitDTO }` — the query unit belongs to this family; use it directly.
 *  - `{ unitless: true }` — no units defined for the family; emit a bare value.
 *  - `{ expanded: UnitDTO[] }` — no query unit match; emit one suggestion per family unit.
 */
type UnitExpansion =
  { matched: UnitDTO } | { unitless: true } | { expanded: UnitDTO[] };

function resolveExpansionUnits(
  meta: NumericCharacterMetaRow,
  resolvedUnit: UnitDTO | null,
  unitsByFamily: Map<number, UnitDTO[]>,
): UnitExpansion {
  const unitMatchesFamily =
    resolvedUnit !== null && resolvedUnit.familyId === meta.unitFamilyId;

  if (unitMatchesFamily) return { matched: resolvedUnit! };

  const familyUnits = unitsByFamily.get(meta.unitFamilyId) ?? [];
  if (familyUnits.length === 0) return { unitless: true };

  return { expanded: familyUnits };
}

/**
 * Search trait values within a feature using fuzzy/trigram matching.
 * DB fetch → JS scoring → top-N results.
 */
export async function searchCategoricalSuggestions(opts: {
  featureId: number;
  q: string;
  limit: number;
}): Promise<CategoricalValueSuggestion[]> {
  const { featureId, q, limit } = opts;
  const trimmed = q.trim();
  if (!trimmed) return [];

  const fq = buildFuzzyQuery(trimmed);

  const rows = await queryCategoricalSuggestionRows({
    featureId,
    fq,
    sqlLimit: limit * 4,
  });

  return rankByFuzzyScore(rows, fq, {
    label: (row) => row.traitValueLabel,
    similarity: (row) => row.similarityScore,
    // Small bump if the character label also matches the query
    bonus: (row) =>
      row.characterLabel.toLowerCase().includes(fq.qLower) ? 5 : 0,
  })
    .slice(0, limit)
    .map((row) => ({
      kind: "categorical-value" as const,
      characterId: row.characterId,
      characterLabel: row.characterLabel,
      traitValueId: row.traitValueId,
      traitValueLabel: row.traitValueLabel,
      traitValueDescription: row.traitValueDescription,
      traitValueHexCode: row.traitValueHexCode,
    }));
}

/**
 * Build numeric single-value suggestions for a parsed numeric query.
 * Expands into all units for a family when the query has no/mismatched unit.
 */
export async function buildNumericSingleSuggestions(opts: {
  featureId: number;
  parsedNumeric: ParsedNumeric;
  limit: number;
  /**
   * Optional lever to return single/range/both for single-style suggestions,
   * i.e. if you want to include "1 cm" as a result for a range character
   * rather than using the full-range "~1cm"/"<=1cm"/"1-3cm" from
   * {@link buildNumericRangeSuggestions}.
   */
  kind?: "single" | "range";
}): Promise<NumericSingleSuggestion[]> {
  const { featureId, parsedNumeric, limit, kind } = opts;
  if (parsedNumeric.kind !== "single") return [];

  const token = normalizeUnitToken(parsedNumeric.unitText);
  const resolvedUnit = token ? await resolveUnitFromToken(token) : null;

  const metas = await queryNumericCharacterMetas({ featureId, kind, limit });

  const unitsByFamily = await getUnitsForFamilies([
    ...new Set(metas.map((m) => m.unitFamilyId)),
  ]);

  const suggestions: NumericSingleSuggestion[] = [];
  const value = parsedNumeric.value;

  for (const row of metas) {
    const expansion = resolveExpansionUnits(row, resolvedUnit, unitsByFamily);

    const base = {
      kind: "numeric-single" as const,
      characterId: row.characterId,
      characterLabel: row.characterLabel,
      value,
      unitFamilyId: row.unitFamilyId,
    };

    if ("matched" in expansion) {
      const u = expansion.matched;
      suggestions.push({
        ...base,
        displayUnitId: u.id,
        unitKey: u.key,
        unitScale: u.scale,
        unitLabel: u.symbol,
        displayValue: `${value} ${u.symbol}`,
      });
    } else if ("unitless" in expansion) {
      suggestions.push({
        ...base,
        displayUnitId: null,
        unitKey: null,
        unitScale: null,
        unitLabel: null,
        displayValue: `${value}`,
      });
    } else {
      for (const u of expansion.expanded) {
        suggestions.push({
          ...base,
          displayUnitId: u.id,
          unitKey: u.key,
          unitScale: u.scale,
          unitLabel: u.symbol,
          displayValue: `${value} ${u.symbol}`,
        });
      }
    }
  }

  return suggestions.slice(0, limit);
}

/**
 * Build numeric range suggestions for a parsed range query.
 * Expands into all units for a family when the query has no/mismatched unit.
 */
export async function buildNumericRangeSuggestions(opts: {
  featureId: number;
  parsedNumeric: ParsedNumeric;
  limit: number;
}): Promise<NumericRangeSuggestion[]> {
  const { featureId, parsedNumeric, limit } = opts;
  // A plain single value (e.g. "4mm", no dash) is also offered against
  // range-kind characters as a degenerate (min === max) range.
  // Curators generally won't be thinking "I need to enter a valid
  // range signature for my range character".
  if (parsedNumeric.kind !== "range" && parsedNumeric.kind !== "single") {
    return [];
  }

  const token = normalizeUnitToken(parsedNumeric.unitText);
  const resolvedUnit = token ? await resolveUnitFromToken(token) : null;

  const metas = await queryNumericCharacterMetas({
    featureId,
    kind: "range",
    limit,
  });

  const unitsByFamily = await getUnitsForFamilies([
    ...new Set(metas.map((m) => m.unitFamilyId)),
  ]);

  const suggestions: NumericRangeSuggestion[] = [];
  const { min, max } =
    parsedNumeric.kind === "range"
      ? parsedNumeric
      : { min: parsedNumeric.value, max: parsedNumeric.value };

  function rangeDisplay(unitSymbol?: string): string {
    const numStr =
      min !== null && max !== null
        ? min === max
          ? `~${min}`
          : `${min}–${max}`
        : min !== null
          ? `≥ ${min}`
          : `≤ ${max}`;
    return unitSymbol ? `${numStr} ${unitSymbol}` : numStr;
  }

  for (const row of metas) {
    const expansion = resolveExpansionUnits(row, resolvedUnit, unitsByFamily);

    const base = {
      kind: "numeric-range" as const,
      characterId: row.characterId,
      characterLabel: row.characterLabel,
      min,
      max,
      unitFamilyId: row.unitFamilyId,
    };

    if ("matched" in expansion) {
      const u = expansion.matched;
      suggestions.push({
        ...base,
        displayUnitId: u.id,
        unitKey: u.key,
        unitScale: u.scale,
        unitLabel: u.symbol,
        displayValue: rangeDisplay(u.symbol),
      });
    } else if ("unitless" in expansion) {
      suggestions.push({
        ...base,
        displayUnitId: null,
        unitKey: null,
        unitScale: null,
        unitLabel: null,
        displayValue: rangeDisplay(),
      });
    } else {
      for (const u of expansion.expanded) {
        suggestions.push({
          ...base,
          displayUnitId: u.id,
          unitKey: u.key,
          unitScale: u.scale,
          unitLabel: u.symbol,
          displayValue: rangeDisplay(u.symbol),
        });
      }
    }
  }

  return suggestions.slice(0, limit);
}

/**
 * Return all trait suggestions for a query scoped to a feature.
 * Combines categorical and numeric (single + range) results.
 */
export async function searchCharacterStateSuggestions(opts: {
  featureId: number;
  q: string;
  limit?: number;
}): Promise<TraitSuggestion[]> {
  const { featureId, q } = opts;
  const limit = opts.limit ?? 20;

  const parsedNumeric = parseNumericQuery(q);
  const isNumericQuery =
    parsedNumeric.kind === "single" || parsedNumeric.kind === "range";

  const [categorical, numericSingle, numericRange] = await Promise.all([
    searchCategoricalSuggestions({ featureId, q, limit }),
    isNumericQuery
      ? buildNumericSingleSuggestions({
          featureId,
          parsedNumeric,
          limit,
          kind: "single",
        })
      : Promise.resolve([]),
    isNumericQuery
      ? buildNumericRangeSuggestions({ featureId, parsedNumeric, limit })
      : Promise.resolve([]),
  ]);

  const merged: TraitSuggestion[] = isNumericQuery
    ? [...numericSingle, ...numericRange, ...categorical]
    : [...categorical];

  return merged.slice(0, limit);
}

/**
 * Search modifier values using fuzzy/trigram matching.
 * Returns canonical values only — aliases are vocabulary implementation details.
 * Not scoped to any feature; modifiers are a global vocabulary.
 */
export async function searchModifierSuggestions(opts: {
  q: string;
  limit?: number;
}): Promise<ModifierSuggestion[]> {
  const { q } = opts;
  const limit = opts.limit ?? 20;

  const trimmed = q.trim();
  if (!trimmed) {
    const rows = await queryAllModifiersByUsage(limit);
    return rows.map((row) => ({
      kind: "modifier" as const,
      modifierId: row.modifierId,
      modifierValue: row.modifierValue,
      affixType: row.affixType,
      groupId: row.groupId,
      groupLabel: row.groupLabel,
      groupClass: row.groupClass,
    }));
  }

  const fq = buildFuzzyQuery(trimmed);

  const rows = await queryModifierSuggestionRows({
    fq,
    sqlLimit: limit * 4,
  });

  return rankByFuzzyScore(rows, fq, {
    label: (row) => row.modifierValue,
    similarity: (row) => row.similarityScore,
    // Small bump if the group label also matches the query
    bonus: (row) => (row.groupLabel.toLowerCase().includes(fq.qLower) ? 5 : 0),
  })
    .slice(0, limit)
    .map((row) => ({
      kind: "modifier",
      modifierId: row.modifierId,
      modifierValue: row.modifierValue,
      affixType: row.affixType,
      groupId: row.groupId,
      groupLabel: row.groupLabel,
      groupClass: row.groupClass,
    }));
}

/**
 * State suggestions for search filters, as opposed to authoring.
 * Feature scope is optional, and both single/range yield single values.
 */
export async function searchCharacterStateFilterSuggestions(opts: {
  /** Omit to search every character. */
  featureId?: number;
  q: string;
  limit?: number;
}): Promise<TraitSuggestion[]> {
  const { featureId, q } = opts;
  const limit = opts.limit ?? 20;
  const trimmed = q.trim();
  if (!trimmed) return [];

  const fq = buildFuzzyQuery(trimmed);
  const parsedNumeric = parseNumericQuery(trimmed);

  const [rows, numeric] = await Promise.all([
    queryCategoricalSuggestionRows({ featureId, fq, sqlLimit: limit * 4 }),
    // Numeric states need feature to mean anything;
    // "Diameter 5 cm" isn't really worth surfacing, since...
    // diameter of what?
    parsedNumeric.kind === "single" && featureId !== undefined
      ? buildNumericSingleSuggestions({ featureId, parsedNumeric, limit })
      : Promise.resolve([]),
  ]);

  const categorical = rankByFuzzyScore(rows, fq, {
    label: (row) => row.traitValueLabel,
    similarity: (row) => row.similarityScore,
    bonus: (row) =>
      row.characterLabel.toLowerCase().includes(fq.qLower) ? 5 : 0,
  }).map((row): CategoricalValueSuggestion => ({
    kind: "categorical-value",
    characterId: row.characterId,
    characterLabel: row.characterLabel,
    traitValueId: row.traitValueId,
    traitValueLabel: row.traitValueLabel,
    traitValueDescription: row.traitValueDescription,
    traitValueHexCode: row.traitValueHexCode,
  }));

  return [...numeric, ...categorical].slice(0, limit);
}

/** Fuzzy feature search by name. */
export async function searchFeatureSuggestions(opts: {
  q: string;
  limit?: number;
}): Promise<FeatureSuggestion[]> {
  const limit = opts.limit ?? 20;
  const trimmed = opts.q.trim();
  if (!trimmed) return [];

  const fq = buildFuzzyQuery(trimmed);
  const rows = await queryFeatureSuggestionRows({ fq, sqlLimit: limit * 4 });

  return rankByFuzzyScore(rows, fq, {
    label: (row) => row.label,
    similarity: (row) => row.similarityScore,
  })
    .slice(0, limit)
    .map((row) => ({
      id: row.id,
      label: row.label,
      description: row.description,
    }));
}
