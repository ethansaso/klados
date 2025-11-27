import { createServerFn } from "@tanstack/react-start";
import { and, eq, ilike, or, sql } from "drizzle-orm";
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

  const qLower = trimmed.toLowerCase();

  // ILIKE needle
  const likeNeedle = `%${qLower.replace(/([%_\\])/g, "\\$1")}%`;

  // "Normalized": punctuation -> space.  "blue-green" -> "blue green"
  const normalizedQuery = qLower.replace(/[^a-z0-9]+/g, " ").trim();

  // "Squashed": strip non-alphanumerics.  "blue green" / "blue-green" -> "bluegreen"
  const squashedQuery = qLower.replace(/[^a-z0-9]+/g, "").trim();

  // Trigram similarity threshold – controls how fuzzy things are
  const SIM_THRESHOLD = 0.2;

  // Pull back more than limit so JS can rank
  const sqlLimit = limit * 4;

  const rows = await db
    .select({
      characterId: character.id,
      characterLabel: character.label,
      groupId: character.groupId,
      groupLabel: characterGroup.label,
      traitValueId: categoricalTraitValue.id,
      traitValueLabel: categoricalTraitValue.label,
      similarityScore: sql<number>`
        similarity(
          lower(${categoricalTraitValue.label}),
          ${qLower}
        )
      `,
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
          // 1) Normalized substring: handles hyphens/spaces
          sql`
            regexp_replace(lower(${categoricalTraitValue.label}), '[^a-z0-9]+', ' ', 'g')
            LIKE ${`%${normalizedQuery}%`}
          `,
          // 2) Trigram similarity: handles typos ("bluegren", "yellowy", etc.)
          sql`
            similarity(
              lower(${categoricalTraitValue.label}),
              ${qLower}
            ) >= ${SIM_THRESHOLD}
          `,
          // 3) Raw substring fallback
          ilike(categoricalTraitValue.label, likeNeedle),
          ilike(categoricalTraitValue.key, likeNeedle)
        )
      )
    )
    // Just a stable default order; real ranking is in JS:
    .orderBy(character.label, categoricalTraitValue.label)
    .limit(sqlLimit);

  // JS-side dedupe + scoring
  const seen = new Set<string>();
  const scored: { row: (typeof rows)[number]; score: number }[] = [];

  for (const row of rows) {
    const key = `${row.characterId}:${row.traitValueId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const labelLower = row.traitValueLabel.toLowerCase();
    const normalizedLabel = labelLower.replace(/[^a-z0-9]+/g, " ").trim();
    const squashedLabel = labelLower.replace(/[^a-z0-9]+/g, "").trim();
    const sim = row.similarityScore ?? 0;

    let score = 0;

    // 1) Huge boost: squashed equality ("bluegreen" == "blue-green")
    if (squashedQuery && squashedLabel === squashedQuery) {
      score += 200;
    }

    // 2) Strong: normalized equality ("blue green" == "blue-green")
    if (normalizedQuery && normalizedLabel === normalizedQuery) {
      score += 120;
    }

    // 3) Prefix normalized match
    if (normalizedQuery && normalizedLabel.startsWith(normalizedQuery)) {
      score += 60;
    }

    // 4) Substring normalized match
    if (normalizedQuery && normalizedLabel.includes(normalizedQuery)) {
      score += 40;
    }

    // 5) Raw prefix / substring on original label
    if (labelLower.startsWith(qLower)) {
      score += 30;
    } else if (labelLower.includes(qLower)) {
      score += 20;
    }

    // 6) Trigram similarity as a soft boost
    //    (helps with "bluegren" etc., but won't beat the equality boosts)
    score += sim * 25;

    // 7) Small bump if character label matches
    const charLabelLower = row.characterLabel.toLowerCase();
    if (charLabelLower.includes(qLower)) {
      score += 5;
    }

    scored.push({ row, score });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;

    // Stable tie-breakers
    const aChar = a.row.characterLabel.toLowerCase();
    const bChar = b.row.characterLabel.toLowerCase();
    if (aChar !== bChar) return aChar.localeCompare(bChar);

    const aVal = a.row.traitValueLabel.toLowerCase();
    const bVal = b.row.traitValueLabel.toLowerCase();
    return aVal.localeCompare(bVal);
  });

  const suggestions: CategoricalValueSuggestion[] = [];

  for (const { row } of scored.slice(0, limit)) {
    suggestions.push({
      kind: "categorical-value",
      characterId: row.characterId,
      characterLabel: row.characterLabel,
      groupId: row.groupId,
      groupLabel: row.groupLabel,
      traitValueId: row.traitValueId,
      traitValueLabel: row.traitValueLabel,
    });
  }

  return suggestions;
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
      groupId: character.groupId,
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
      groupId: row.groupId,
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
      groupId: character.groupId,
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
      groupId: row.groupId,
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
    const isNumericQuery =
      parsedNumeric.kind === "single" || parsedNumeric.kind === "range";

    const [categorical, numericSingle, numericRange] = await Promise.all([
      searchCategoricalSuggestions({ groupId, q, limit }),
      buildNumericSingleSuggestions({ groupId, parsedNumeric, limit }),
      buildNumericRangeSuggestions({ groupId, parsedNumeric, limit }),
    ]);

    let merged: TraitSuggestion[];

    if (isNumericQuery) {
      // Numeric-looking query → numeric suggestions first, but keep
      // categorical in the exact order returned from searchCategoricalSuggestions
      merged = [...numericSingle, ...numericRange, ...categorical];
    } else {
      // Texty query → categorical first, in their existing order
      merged = [...categorical, ...numericSingle, ...numericRange];
    }

    return merged.slice(0, limit);
  });
