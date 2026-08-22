import { and, desc, eq, exists, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "../../../../db/client";
import {
  modifierGroup,
  modifierValue,
} from "../../../../db/schema/glossary/modifiers";
import { unit, unitFamily } from "../../../../db/schema/glossary/units";
import {
  categoricalTraitValue,
  character,
  characterFeature,
  feature,
  numericCharacterMeta,
} from "../../../../db/schema/schema";
import {
  type FuzzyQuery,
  fuzzyLabelPredicate,
  fuzzySimilarity,
  withFuzzyThreshold,
} from "../../utils/sql/fuzzyLabel";
import {
  modCatUsageSel,
  modNumUsageSel,
  modRangeUsageSel,
} from "../modifiers/selectors";
import type { UnitDTO } from "../units/types";

/** Includes trigram similarity. */
export type CategoricalSuggestionRow = {
  characterId: number;
  characterLabel: string;
  traitValueId: number;
  traitValueLabel: string;
  traitValueDescription: string;
  traitValueHexCode: string | null;
  similarityScore: number;
};

export type NumericCharacterMetaRow = {
  characterId: number;
  characterLabel: string;
  unitFamilyId: number;
  kind: "single" | "range";
};

export type ModifierSuggestionRow = {
  modifierId: number;
  modifierValue: string;
  affixType: "prefix" | "suffix";
  groupId: number;
  groupLabel: string;
  similarityScore: number;
};

export type FeatureSuggestionRow = {
  id: number;
  label: string;
  description: string;
  similarityScore: number;
};

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * Resolve a normalised unit token to a UnitDTO by matching key or symbol.
 */
export async function resolveUnitFromToken(
  token: string,
): Promise<UnitDTO | null> {
  const t = token.trim().toLowerCase();

  const rows = await db
    .select({
      id: unit.id,
      familyId: unit.familyId,
      key: unit.key,
      symbol: unit.symbol,
      scale: unit.scale,
    })
    .from(unit)
    .where(
      or(eq(sql`lower(${unit.key})`, t), eq(sql`lower(${unit.symbol})`, t)),
    )
    .limit(2);

  if (rows.length === 0) return null;

  const keyMatch = rows.find((r) => r.key.toLowerCase() === t);
  return keyMatch ?? rows[0] ?? null;
}

/**
 * Fetch all units for the given unit-family IDs, grouped by family.
 */
export async function getUnitsForFamilies(
  familyIds: number[],
): Promise<Map<number, UnitDTO[]>> {
  if (familyIds.length === 0) return new Map();

  const rows = await db
    .select({
      id: unit.id,
      familyId: unit.familyId,
      key: unit.key,
      symbol: unit.symbol,
      scale: unit.scale,
    })
    .from(unit)
    .where(inArray(unit.familyId, familyIds));

  const byFamily = new Map<number, UnitDTO[]>();
  for (const row of rows) {
    const list = byFamily.get(row.familyId) ?? [];
    list.push(row);
    byFamily.set(row.familyId, list);
  }
  return byFamily;
}

/** Features matching a fuzzy query, ranked by relevance. */
export async function queryFeatureSuggestionRows(opts: {
  fq: FuzzyQuery;
  sqlLimit: number;
}): Promise<FeatureSuggestionRow[]> {
  const { fq, sqlLimit } = opts;
  const similarity = fuzzySimilarity(feature.label, fq);

  return withFuzzyThreshold((tx) =>
    tx
      .select({
        id: feature.id,
        label: feature.label,
        description: feature.description,
        similarityScore: similarity,
      })
      .from(feature)
      .where(fuzzyLabelPredicate(feature.label, fq))
      .orderBy(desc(similarity), feature.label)
      .limit(sqlLimit),
  );
}

/**
 * Trait values matching a fuzzy query, one row per value.
 * Ordered by relevance.
 *
 * Feature scope uses EXISTS, not JOIN, to avoid row bloat.
 */
export async function queryCategoricalSuggestionRows(opts: {
  /** Omit to search every character. */
  featureId?: number;
  fq: FuzzyQuery;
  sqlLimit: number;
}): Promise<CategoricalSuggestionRow[]> {
  const { featureId, fq, sqlLimit } = opts;
  const similarity = fuzzySimilarity(categoricalTraitValue.label, fq);

  return withFuzzyThreshold((tx) =>
    tx
      .select({
        characterId: character.id,
        characterLabel: character.label,
        traitValueId: categoricalTraitValue.id,
        traitValueLabel: categoricalTraitValue.label,
        traitValueHexCode: categoricalTraitValue.hexCode,
        traitValueDescription: categoricalTraitValue.description,
        similarityScore: similarity,
      })
      .from(categoricalTraitValue)
      .innerJoin(character, eq(character.id, categoricalTraitValue.characterId))
      .where(
        and(
          fuzzyLabelPredicate(categoricalTraitValue.label, fq),
          featureId === undefined
            ? undefined
            : exists(
                db
                  .select({ _: sql`1` })
                  .from(characterFeature)
                  .where(
                    and(
                      eq(characterFeature.characterId, character.id),
                      eq(characterFeature.featureId, featureId),
                    ),
                  ),
              ),
        ),
      )
      .orderBy(desc(similarity), categoricalTraitValue.label)
      .limit(sqlLimit),
  );
}

/**
 * Raw DB query for modifier value suggestions (canonical values only).
 * Returns more rows than `limit` so the service can re-rank in JS.
 *
 * Not scoped to a feature -- modifiers are global vocabulary.
 */
export async function queryModifierSuggestionRows(opts: {
  fq: FuzzyQuery;
  sqlLimit: number;
}): Promise<ModifierSuggestionRow[]> {
  const { fq, sqlLimit } = opts;
  const similarity = fuzzySimilarity(modifierValue.value, fq);

  return withFuzzyThreshold((tx) =>
    tx
      .select({
        modifierId: modifierValue.id,
        modifierValue: modifierValue.value,
        affixType: modifierValue.affixType,
        groupId: modifierGroup.id,
        groupLabel: modifierGroup.label,
        similarityScore: similarity,
      })
      .from(modifierValue)
      .innerJoin(modifierGroup, eq(modifierGroup.id, modifierValue.groupId))
      .where(
        and(
          // Only canonical values (no aliases)
          isNull(modifierValue.canonicalValueId),
          fuzzyLabelPredicate(modifierValue.value, fq),
        ),
      )
      .orderBy(desc(similarity), modifierValue.value)
      .limit(sqlLimit),
  );
}

/**
 * Fetch all canonical modifier values, ordered by
 * total usage count (desc) then group label and value alphabetically.
 */
export async function queryAllModifiersByUsage(
  sqlLimit: number,
): Promise<ModifierSuggestionRow[]> {
  const usageExpr = sql<number>`
    COALESCE(${modCatUsageSel.catUsageCount}, 0) +
    COALESCE(${modNumUsageSel.numUsageCount}, 0) +
    COALESCE(${modRangeUsageSel.rangeUsageCount}, 0)
  `;

  return db
    .select({
      modifierId: modifierValue.id,
      modifierValue: modifierValue.value,
      affixType: modifierValue.affixType,
      groupId: modifierGroup.id,
      groupLabel: modifierGroup.label,
      similarityScore: sql<number>`0`,
    })
    .from(modifierValue)
    .innerJoin(modifierGroup, eq(modifierGroup.id, modifierValue.groupId))
    .leftJoin(modCatUsageSel, eq(modCatUsageSel.modifierId, modifierValue.id))
    .leftJoin(modNumUsageSel, eq(modNumUsageSel.modifierId, modifierValue.id))
    .leftJoin(
      modRangeUsageSel,
      eq(modRangeUsageSel.modifierId, modifierValue.id),
    )
    .where(isNull(modifierValue.canonicalValueId))
    .orderBy(desc(usageExpr), modifierValue.value)
    .limit(sqlLimit);
}

/**
 * Fetch numeric character metadata for a feature, filtered by kind.
 */
export async function queryNumericCharacterMetas(opts: {
  featureId: number;
  /** Omit to return both kinds. */
  kind?: "single" | "range";
  /**
   * Restricts to characters measured in this family. Set when the query names
   * a unit, so that "4 g" can't offer a length character (or a unitless one).
   */
  unitFamilyId?: number;
  limit: number;
}): Promise<NumericCharacterMetaRow[]> {
  const { featureId, kind, unitFamilyId, limit } = opts;

  return db
    .select({
      characterId: character.id,
      characterLabel: character.label,
      unitFamilyId: numericCharacterMeta.unitFamilyId,
      kind: numericCharacterMeta.kind,
    })
    .from(numericCharacterMeta)
    .innerJoin(character, eq(character.id, numericCharacterMeta.characterId))
    .innerJoin(unitFamily, eq(unitFamily.id, numericCharacterMeta.unitFamilyId))
    .where(
      and(
        exists(
          db
            .select({ _: sql`1` })
            .from(characterFeature)
            .where(
              and(
                eq(characterFeature.characterId, character.id),
                eq(characterFeature.featureId, featureId),
              ),
            ),
        ),
        kind === undefined ? undefined : eq(numericCharacterMeta.kind, kind),
        unitFamilyId === undefined
          ? undefined
          : eq(numericCharacterMeta.unitFamilyId, unitFamilyId),
      ),
    )
    .limit(limit * 4);
}
