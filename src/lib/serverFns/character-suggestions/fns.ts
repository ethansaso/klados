import { createServerFn } from "@tanstack/react-start";
import { and, eq, ilike, or } from "drizzle-orm";
import z from "zod";

import { db } from "../../../db/client";
import {
  categoricalCharacterMeta,
  categoricalTraitSet,
  categoricalTraitValue,
  character,
  characterGroup,
  numericCharacterMeta,
} from "../../../db/schema/schema";
import {
  ParsedNumeric,
  parseNumericQuery,
  resolveRequestedUnit,
} from "./numericParsing";
import {
  CategoricalValueSuggestion,
  NumericRangeSuggestion,
  NumericSingleSuggestion,
  TraitSuggestion,
} from "./types";

/**
 * Categorical suggestions: find trait values within the given group
 * whose labels/keys match the query.
 */
async function searchCategoricalSuggestions(opts: {
  groupId: number;
  q: string;
  limit: number;
}): Promise<CategoricalValueSuggestion[]> {
  const { groupId, q, limit } = opts;
  const trimmed = q.trim();
  if (!trimmed) return [];

  const needle = `%${trimmed.toLowerCase()}%`;

  const rows = await db
    .select({
      characterId: character.id,
      characterLabel: character.label,
      groupLabel: characterGroup.label,
      traitValueId: categoricalTraitValue.id,
      valueLabel: categoricalTraitValue.label,
      valueKey: categoricalTraitValue.key,
    })
    .from(categoricalTraitValue)
    .innerJoin(
      categoricalTraitSet,
      eq(categoricalTraitSet.id, categoricalTraitValue.setId)
    )
    .innerJoin(
      categoricalCharacterMeta,
      eq(categoricalCharacterMeta.traitSetId, categoricalTraitSet.id)
    )
    .innerJoin(
      character,
      eq(character.id, categoricalCharacterMeta.characterId)
    )
    .innerJoin(characterGroup, eq(characterGroup.id, character.groupId))
    .where(
      and(
        eq(character.groupId, groupId),
        or(
          ilike(categoricalTraitValue.label, needle),
          ilike(categoricalTraitValue.key, needle)
          // optionally: ilike(character.label, needle)
        )
      )
    )
    .limit(limit);

  const seen = new Set<string>();
  const suggestions: CategoricalValueSuggestion[] = [];

  for (const row of rows) {
    const key = `${row.characterId}:${row.traitValueId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    suggestions.push({
      kind: "categorical-value",
      characterId: row.characterId,
      characterLabel: row.characterLabel,
      groupLabel: row.groupLabel,
      traitValueId: row.traitValueId,
      valueLabel: row.valueLabel,
      valueKey: row.valueKey,
    });
  }

  return suggestions.slice(0, limit);
}

/**
 * Numeric single-value suggestions.
 */
async function buildNumericSingleSuggestions(opts: {
  groupId: number;
  parsedNumeric: ParsedNumeric;
  limit: number;
}): Promise<NumericSingleSuggestion[]> {
  const { groupId, parsedNumeric, limit } = opts;
  if (parsedNumeric.kind !== "single") return [];

  const requestedUnit = resolveRequestedUnit(parsedNumeric.unitText);

  const rows = await db
    .select({
      characterId: character.id,
      characterLabel: character.label,
      groupLabel: characterGroup.label,
      unit: numericCharacterMeta.unit,
      kind: numericCharacterMeta.kind,
    })
    .from(numericCharacterMeta)
    .innerJoin(character, eq(character.id, numericCharacterMeta.characterId))
    .innerJoin(characterGroup, eq(characterGroup.id, character.groupId))
    .where(
      and(
        eq(character.groupId, groupId),
        eq(numericCharacterMeta.kind, "single")
      )
    )
    .limit(limit);

  const suggestions: NumericSingleSuggestion[] = [];

  for (const row of rows) {
    if (requestedUnit && row.unit.toLowerCase() !== requestedUnit) {
      continue;
    }

    const value = parsedNumeric.value;
    const unitLabel = row.unit;
    const displayValue = `${value} ${unitLabel}`;

    suggestions.push({
      kind: "numeric-single",
      characterId: row.characterId,
      characterLabel: row.characterLabel,
      groupLabel: row.groupLabel,
      value,
      unitLabel,
      displayValue,
    });
  }

  return suggestions.slice(0, limit);
}

/**
 * Numeric range suggestions.
 */
async function buildNumericRangeSuggestions(opts: {
  groupId: number;
  parsedNumeric: ParsedNumeric;
  limit: number;
}): Promise<NumericRangeSuggestion[]> {
  const { groupId, parsedNumeric, limit } = opts;
  if (parsedNumeric.kind !== "range") return [];

  const requestedUnit = resolveRequestedUnit(parsedNumeric.unitText);

  const rows = await db
    .select({
      characterId: character.id,
      characterLabel: character.label,
      groupLabel: characterGroup.label,
      unit: numericCharacterMeta.unit,
      kind: numericCharacterMeta.kind,
    })
    .from(numericCharacterMeta)
    .innerJoin(character, eq(character.id, numericCharacterMeta.characterId))
    .innerJoin(characterGroup, eq(characterGroup.id, character.groupId))
    .where(
      and(
        eq(character.groupId, groupId),
        eq(numericCharacterMeta.kind, "range")
      )
    )
    .limit(limit);

  const suggestions: NumericRangeSuggestion[] = [];

  for (const row of rows) {
    if (requestedUnit && row.unit.toLowerCase() !== requestedUnit) {
      continue;
    }

    const { min, max } = parsedNumeric;
    const unitLabel = row.unit;
    const displayValue = `${min}–${max} ${unitLabel}`;

    suggestions.push({
      kind: "numeric-range",
      characterId: row.characterId,
      characterLabel: row.characterLabel,
      groupLabel: row.groupLabel,
      min,
      max,
      unitLabel,
      displayValue,
    });
  }

  return suggestions.slice(0, limit);
}

/**
 * Search for trait suggestions (categorical values + numeric single/range)
 * scoped to a particular character group.
 */
export const searchGroupTraitSuggestions = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      groupId: z.number().int().nonnegative(),
      q: z.string().trim(),
      limit: z.number().int().min(1).max(50).optional(),
    })
  )
  .handler(async ({ data }): Promise<TraitSuggestion[]> => {
    const { groupId, q } = data;
    const limit = data.limit ?? 20;

    const parsedNumeric = parseNumericQuery(q);

    // Simple merge.
    // TODO: relevance ordering
    const [categorical, numericSingle, numericRange] = await Promise.all([
      searchCategoricalSuggestions({ groupId, q, limit }),
      buildNumericSingleSuggestions({ groupId, parsedNumeric, limit }),
      buildNumericRangeSuggestions({ groupId, parsedNumeric, limit }),
    ]);

    return [...categorical, ...numericSingle, ...numericRange].slice(0, limit);
  });
