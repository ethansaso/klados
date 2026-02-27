import {
  aliasedTable,
  and,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  or,
  sql,
} from "drizzle-orm";

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
  modCatUsageSel,
  modNumUsageSel,
  modRangeUsageSel,
} from "../modifiers/selectors";
import type { UnitDTO } from "../units/types";

export type CategoricalSuggestionRow = {
  characterId: number;
  characterLabel: string;
  featureId: number;
  featureLabel: string;
  traitValueId: number;
  traitValueLabel: string;
  traitValueHexCode: string | null;
  similarityScore: number;
};

export type NumericCharacterMetaRow = {
  characterId: number;
  characterLabel: string;
  featureId: number;
  featureLabel: string;
  unitFamilyId: number;
  kind: "single" | "range";
};

export type ModifierSuggestionRow = {
  modifierId: number;
  modifierValue: string;
  affixType: "prefix" | "suffix";
  groupId: number;
  groupLabel: string;
  groupClass: "positional" | "reliability" | "demographic" | "reactive";
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

/**
 * Raw DB query for categorical trait-value suggestions within a feature.
 * Returns more rows than `limit` so the service can re-rank in JS.
 *
 * Trigram similarity is included in the SELECT so the service can use it
 * as a scoring signal without a second query.
 */
export async function queryCategoricalSuggestionRows(opts: {
  featureId: number;
  qLower: string;
  likeNeedle: string;
  normalizedQuery: string;
  simThreshold: number;
  sqlLimit: number;
}): Promise<CategoricalSuggestionRow[]> {
  const {
    featureId,
    qLower,
    likeNeedle,
    normalizedQuery,
    simThreshold,
    sqlLimit,
  } = opts;

  // Alias for self-join to canonical value (hex / description lives there)
  const canonicalValue = aliasedTable(categoricalTraitValue, "canonical_value");

  return (
    db
      .select({
        characterId: character.id,
        characterLabel: character.label,
        featureId: feature.id,
        featureLabel: feature.label,
        traitValueId: categoricalTraitValue.id,
        traitValueLabel: categoricalTraitValue.label,
        // Hex from canonical value (or self when already canonical)
        traitValueHexCode: canonicalValue.hexCode,
        similarityScore: sql<number>`
        similarity(
          lower(${categoricalTraitValue.label}),
          ${qLower}
        )
      `,
      })
      .from(categoricalTraitValue)
      .innerJoin(character, eq(character.id, categoricalTraitValue.characterId))
      .innerJoin(
        characterFeature,
        eq(characterFeature.characterId, character.id),
      )
      .innerJoin(feature, eq(feature.id, characterFeature.featureId))
      // Self-join: canonical row if alias, self if already canonical
      .innerJoin(
        canonicalValue,
        sql`${canonicalValue.id} = COALESCE(${categoricalTraitValue.canonicalValueId}, ${categoricalTraitValue.id})`,
      )
      .where(
        and(
          eq(feature.id, featureId),
          or(
            // 1) Normalised substring – handles hyphens/spaces ("blue-green" → "blue green")
            sql`
            regexp_replace(lower(${categoricalTraitValue.label}), '[^a-z0-9]+', ' ', 'g')
            LIKE ${`%${normalizedQuery}%`}
          `,
            // 2) Trigram similarity – handles typos ("bluegren", "yellowy", etc.)
            sql`
            similarity(
              lower(${categoricalTraitValue.label}),
              ${qLower}
            ) >= ${simThreshold}
          `,
            // 3) Raw substring fallback
            ilike(categoricalTraitValue.label, likeNeedle),
          ),
        ),
      )
      // Stable default order; JS re-ranks by score
      .orderBy(character.label, categoricalTraitValue.label)
      .limit(sqlLimit)
  );
}

/**
 * Raw DB query for modifier value suggestions (canonical values only).
 * Returns more rows than `limit` so the service can re-rank in JS.
 *
 * Not scoped to a feature — modifiers are global vocabulary.
 */
export async function queryModifierSuggestionRows(opts: {
  qLower: string;
  likeNeedle: string;
  normalizedQuery: string;
  simThreshold: number;
  sqlLimit: number;
}): Promise<ModifierSuggestionRow[]> {
  const { qLower, likeNeedle, normalizedQuery, simThreshold, sqlLimit } = opts;

  return db
    .select({
      modifierId: modifierValue.id,
      modifierValue: modifierValue.value,
      affixType: modifierValue.affixType,
      groupId: modifierGroup.id,
      groupLabel: modifierGroup.label,
      groupClass: modifierGroup.class,
      similarityScore: sql<number>`
        similarity(
          lower(${modifierValue.value}),
          ${qLower}
        )
      `,
    })
    .from(modifierValue)
    .innerJoin(modifierGroup, eq(modifierGroup.id, modifierValue.groupId))
    .where(
      and(
        // Only canonical values (no aliases)
        isNull(modifierValue.canonicalValueId),
        or(
          // 1) Normalised substring
          sql`
            regexp_replace(lower(${modifierValue.value}), '[^a-z0-9]+', ' ', 'g')
            LIKE ${`%${normalizedQuery}%`}
          `,
          // 2) Trigram similarity
          sql`
            similarity(
              lower(${modifierValue.value}),
              ${qLower}
            ) >= ${simThreshold}
          `,
          // 3) Raw substring fallback
          ilike(modifierValue.value, likeNeedle),
        ),
      ),
    )
    .orderBy(modifierGroup.label, modifierValue.value)
    .limit(sqlLimit);
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
      groupClass: modifierGroup.class,
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
  kind: "single" | "range";
  limit: number;
}): Promise<NumericCharacterMetaRow[]> {
  const { featureId, kind, limit } = opts;

  return db
    .select({
      characterId: character.id,
      characterLabel: character.label,
      featureId: feature.id,
      featureLabel: feature.label,
      unitFamilyId: numericCharacterMeta.unitFamilyId,
      kind: numericCharacterMeta.kind,
    })
    .from(numericCharacterMeta)
    .innerJoin(character, eq(character.id, numericCharacterMeta.characterId))
    .innerJoin(characterFeature, eq(characterFeature.characterId, character.id))
    .innerJoin(feature, eq(feature.id, characterFeature.featureId))
    .innerJoin(unitFamily, eq(unitFamily.id, numericCharacterMeta.unitFamilyId))
    .where(and(eq(feature.id, featureId), eq(numericCharacterMeta.kind, kind)))
    .limit(limit * 4);
}
