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
  queryModifierSuggestionRows,
  queryNumericCharacterMetas,
  resolveUnitFromToken,
  type NumericCharacterMetaRow,
} from "./repo";
import type {
  CategoricalValueSuggestion,
  ModifierSuggestion,
  NumericRangeSuggestion,
  NumericSingleSuggestion,
  TraitSuggestion,
} from "./types";

// ── Private helpers ───────────────────────────────────────────────────────────

/**
 * Shared fuzzy scoring for a single candidate label against a pre-computed
 * query breakdown. Higher score = better match.
 *
 * Callers may add further score bonuses on top (e.g. a character-label bump).
 */
function computeFuzzyScore(
  labelLower: string,
  opts: {
    qLower: string;
    normalizedQuery: string;
    squashedQuery: string;
    similarityScore: number;
  },
): number {
  const { qLower, normalizedQuery, squashedQuery, similarityScore } = opts;
  const normalizedLabel = labelLower.replace(/[^a-z0-9]+/g, " ").trim();
  const squashedLabel = labelLower.replace(/[^a-z0-9]+/g, "").trim();

  let score = 0;
  // 1) Huge boost: squashed equality ("bluegreen" == "blue-green")
  if (squashedQuery && squashedLabel === squashedQuery) score += 200;
  // 2) Strong: normalised equality ("blue green" == "blue-green")
  if (normalizedQuery && normalizedLabel === normalizedQuery) score += 120;
  // 3) Prefix normalised match
  if (normalizedQuery && normalizedLabel.startsWith(normalizedQuery))
    score += 60;
  // 4) Substring normalised match
  if (normalizedQuery && normalizedLabel.includes(normalizedQuery)) score += 40;
  // 5) Raw prefix / substring on original label
  if (labelLower.startsWith(qLower)) score += 30;
  else if (labelLower.includes(qLower)) score += 20;
  // 6) Trigram similarity as a soft boost
  score += similarityScore * 25;
  return score;
}

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

  const qLower = trimmed.toLowerCase();
  const likeNeedle = `%${qLower.replace(/([%_\\])/g, "\\$1")}%`;
  const normalizedQuery = qLower.replace(/[^a-z0-9]+/g, " ").trim();
  const squashedQuery = qLower.replace(/[^a-z0-9]+/g, "").trim();

  const SIM_THRESHOLD = 0.2;

  const rows = await queryCategoricalSuggestionRows({
    featureId,
    qLower,
    likeNeedle,
    normalizedQuery,
    simThreshold: SIM_THRESHOLD,
    sqlLimit: limit * 4,
  });

  // JS-side dedupe + scoring
  const seen = new Set<string>();
  const scored: { row: (typeof rows)[number]; score: number }[] = [];

  for (const row of rows) {
    const key = `${row.characterId}:${row.traitValueId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const labelLower = row.traitValueLabel.toLowerCase();
    let score = computeFuzzyScore(labelLower, {
      qLower,
      normalizedQuery,
      squashedQuery,
      similarityScore: row.similarityScore ?? 0,
    });

    // Small bump if the character label also matches the query
    if (row.characterLabel.toLowerCase().includes(qLower)) score += 5;

    scored.push({ row, score });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aChar = a.row.characterLabel.toLowerCase();
    const bChar = b.row.characterLabel.toLowerCase();
    if (aChar !== bChar) return aChar.localeCompare(bChar);
    return a.row.traitValueLabel
      .toLowerCase()
      .localeCompare(b.row.traitValueLabel.toLowerCase());
  });

  return scored.slice(0, limit).map(({ row }) => ({
    kind: "categorical-value",
    characterId: row.characterId,
    characterLabel: row.characterLabel,
    featureId: row.featureId,
    featureLabel: row.featureLabel,
    traitValueId: row.traitValueId,
    traitValueLabel: row.traitValueLabel,
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
}): Promise<NumericSingleSuggestion[]> {
  const { featureId, parsedNumeric, limit } = opts;
  if (parsedNumeric.kind !== "single") return [];

  const token = normalizeUnitToken(parsedNumeric.unitText);
  const resolvedUnit = token ? await resolveUnitFromToken(token) : null;

  const metas = await queryNumericCharacterMetas({
    featureId,
    kind: "single",
    limit,
  });

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
      featureId: row.featureId,
      featureLabel: row.featureLabel,
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
      featureId: row.featureId,
      featureLabel: row.featureLabel,
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
      ? buildNumericSingleSuggestions({ featureId, parsedNumeric, limit })
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

  const qLower = trimmed.toLowerCase();
  const likeNeedle = `%${qLower.replace(/([%_\\])/g, "\\$1")}%`;
  const normalizedQuery = qLower.replace(/[^a-z0-9]+/g, " ").trim();
  const squashedQuery = qLower.replace(/[^a-z0-9]+/g, "").trim();

  const SIM_THRESHOLD = 0.2;

  const rows = await queryModifierSuggestionRows({
    qLower,
    likeNeedle,
    normalizedQuery,
    simThreshold: SIM_THRESHOLD,
    sqlLimit: limit * 4,
  });

  const seen = new Set<number>();
  const scored: { row: (typeof rows)[number]; score: number }[] = [];

  for (const row of rows) {
    if (seen.has(row.modifierId)) continue;
    seen.add(row.modifierId);

    const labelLower = row.modifierValue.toLowerCase();
    let score = computeFuzzyScore(labelLower, {
      qLower,
      normalizedQuery,
      squashedQuery,
      similarityScore: row.similarityScore ?? 0,
    });

    // Small bump if the group label also matches the query
    if (row.groupLabel.toLowerCase().includes(qLower)) score += 5;

    scored.push({ row, score });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aGroup = a.row.groupLabel.toLowerCase();
    const bGroup = b.row.groupLabel.toLowerCase();
    if (aGroup !== bGroup) return aGroup.localeCompare(bGroup);
    return a.row.modifierValue
      .toLowerCase()
      .localeCompare(b.row.modifierValue.toLowerCase());
  });

  return scored.slice(0, limit).map(({ row }) => ({
    kind: "modifier",
    modifierId: row.modifierId,
    modifierValue: row.modifierValue,
    affixType: row.affixType,
    groupId: row.groupId,
    groupLabel: row.groupLabel,
    groupClass: row.groupClass,
  }));
}
