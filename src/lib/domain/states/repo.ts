import { eq, inArray } from "drizzle-orm";
import {
  categoricalCharacterMeta as catMetaTbl,
  taxonCharacterStateCategorical as catStateTbl,
  categoricalTraitValue as catValTbl,
  character as charsTbl,
  feature as featuresTbl,
  taxonCharacterStateModifierCategorical as modCatJunctionTbl,
  modifierGroup as modGroupTbl,
  taxonCharacterStateModifierNumber as modNumJunctionTbl,
  taxonCharacterStateModifierRange as modRangeJunctionTbl,
  modifierValue as modValTbl,
  numericCharacterMeta as numMetaTbl,
  taxonCharacterStateNumber as numStateTbl,
  taxonCharacterStateRange as rangeStateTbl,
  taxonFeatureState as tfsTbl,
  unit as unitsTbl,
} from "../../../../db/schema/schema";
import type { Transaction } from "../../utils/transactionType";
import type {
  CategoricalStateDTO,
  FeatureStateDTO,
  ModifierStateDTO,
  NumberStateDTO,
  RangeStateDTO,
} from "./types";
import type {
  CategoricalCharacterUpdate,
  CharacterByFeatureUpdate,
  NumberCharacterUpdate,
  RangeCharacterUpdate,
} from "./validation";

/** Mapping of taxon ID to TaxonCharacterFeatureStateDTO[]. */
export type TaxonStatesById = Record<string, FeatureStateDTO[]>;

/**
 * Load character states for at least one taxon.
 * Returns a map taxonId -> TaxonCharacterFeatureStateDTO[].
 *
 * For traitValues:
 * - label comes from the **stored** value (alias or canonical),
 * - hexCode comes from the **canonical** value (or itself if canonical).
 */
export async function selectTaxonStatesByTaxonIds(
  tx: Transaction,
  taxonIds: number[],
): Promise<TaxonStatesById> {
  if (!taxonIds.length) return {};

  // Load all feature states up front (including empty ones)
  const featureRows = await tx
    .select({
      taxonId: tfsTbl.taxonId,

      featureId: featuresTbl.id,
      featureLabel: featuresTbl.label,
      featureDescription: featuresTbl.description,
    })
    .from(tfsTbl)
    .innerJoin(featuresTbl, eq(featuresTbl.id, tfsTbl.featureId))
    .where(inArray(tfsTbl.taxonId, taxonIds));

  const byTaxon = new Map<number, Map<number, FeatureStateDTO>>();

  for (const row of featureRows) {
    let featuresById = byTaxon.get(row.taxonId);
    if (!featuresById) {
      featuresById = new Map();
      byTaxon.set(row.taxonId, featuresById);
    }

    featuresById.set(row.featureId, {
      featureId: row.featureId,
      featureLabel: row.featureLabel,
      featureDescription: row.featureDescription,
      states: [],
    });
  }

  // Categorical states
  const catRows = await tx
    .select({
      taxonId: tfsTbl.taxonId,

      featureId: featuresTbl.id,
      stateId: catStateTbl.id,

      characterId: catStateTbl.characterId,
      characterLabel: charsTbl.label,
      characterDescription: charsTbl.description,

      traitValueId: catStateTbl.traitValueId,
      traitValueLabel: catValTbl.label,
      canonicalValueId: catValTbl.canonicalValueId,
    })
    .from(catStateTbl)
    .innerJoin(tfsTbl, eq(tfsTbl.id, catStateTbl.taxonFeatureStateId))
    .innerJoin(featuresTbl, eq(featuresTbl.id, tfsTbl.featureId))
    .innerJoin(charsTbl, eq(charsTbl.id, catStateTbl.characterId))
    .innerJoin(catValTbl, eq(catValTbl.id, catStateTbl.traitValueId))
    .where(inArray(tfsTbl.taxonId, taxonIds));

  const canonicalIds = Array.from(
    new Set(catRows.map((r) => r.canonicalValueId ?? r.traitValueId)),
  );

  const canonicalRows = canonicalIds.length
    ? await tx
        .select({
          id: catValTbl.id,
          hexCode: catValTbl.hexCode,
          description: catValTbl.description,
        })
        .from(catValTbl)
        .where(inArray(catValTbl.id, canonicalIds))
    : [];

  const hexByCanonicalId = new Map(canonicalRows.map((r) => [r.id, r.hexCode]));
  const descriptionByCanonicalId = new Map(
    canonicalRows.map((r) => [r.id, r.description]),
  );

  const catStateIds = catRows.map((r) => r.stateId);
  const rawCatModRows = catStateIds.length
    ? await tx
        .select({
          stateId: modCatJunctionTbl.taxonCharacterStateCategoricalId,
          modifierId: modValTbl.id,
          modifierValue: modValTbl.value,
          affixType: modValTbl.affixType,
          groupId: modGroupTbl.id,
          groupLabel: modGroupTbl.label,
          groupClass: modGroupTbl.class,
        })
        .from(modCatJunctionTbl)
        .innerJoin(modValTbl, eq(modValTbl.id, modCatJunctionTbl.modifierId))
        .innerJoin(modGroupTbl, eq(modGroupTbl.id, modValTbl.groupId))
        .where(
          inArray(
            modCatJunctionTbl.taxonCharacterStateCategoricalId,
            catStateIds,
          ),
        )
    : [];
  const modifiersByCatStateId = new Map<number, ModifierStateDTO[]>();
  for (const m of rawCatModRows) {
    const arr = modifiersByCatStateId.get(m.stateId) ?? [];
    arr.push({
      id: m.modifierId,
      value: m.modifierValue,
      affixType: m.affixType,
      groupId: m.groupId,
      groupLabel: m.groupLabel,
      groupClass: m.groupClass,
    });
    modifiersByCatStateId.set(m.stateId, arr);
  }

  for (const row of catRows) {
    const featuresById = byTaxon.get(row.taxonId);
    if (!featuresById) continue;

    const feature = featuresById.get(row.featureId);
    if (!feature) continue;

    let state = feature.states.find(
      (s) => s.kind === "categorical" && s.characterId === row.characterId,
    ) as CategoricalStateDTO | undefined;

    if (!state) {
      state = {
        kind: "categorical",
        characterId: row.characterId,
        characterLabel: row.characterLabel,
        characterDescription: row.characterDescription,
        traitValues: [],
      };
      feature.states.push(state);
    }

    const canonicalId = row.canonicalValueId ?? row.traitValueId;

    state.traitValues.push({
      id: row.traitValueId,
      canonicalId,
      label: row.traitValueLabel,
      description: descriptionByCanonicalId.get(canonicalId) ?? "",
      hexCode: hexByCanonicalId.get(canonicalId) || undefined,
      modifiers: modifiersByCatStateId.get(row.stateId) ?? [],
    });
  }

  // Number states
  const numRows = await tx
    .select({
      taxonId: tfsTbl.taxonId,

      featureId: featuresTbl.id,
      stateId: numStateTbl.id,

      characterId: numStateTbl.characterId,
      characterLabel: charsTbl.label,
      characterDescription: charsTbl.description,

      siBaseValue: numStateTbl.siBaseValue,
      unitId: unitsTbl.id,
      unitFamilyId: unitsTbl.familyId,
      unitKey: unitsTbl.key,
      unitSymbol: unitsTbl.symbol,
      unitScale: unitsTbl.scale,
    })
    .from(numStateTbl)
    .innerJoin(tfsTbl, eq(tfsTbl.id, numStateTbl.taxonFeatureStateId))
    .innerJoin(featuresTbl, eq(featuresTbl.id, tfsTbl.featureId))
    .innerJoin(charsTbl, eq(charsTbl.id, numStateTbl.characterId))
    .leftJoin(unitsTbl, eq(unitsTbl.id, numStateTbl.displayUnitId))
    .where(inArray(tfsTbl.taxonId, taxonIds));

  const numStateIds = numRows.map((r) => r.stateId);
  const rawNumModRows = numStateIds.length
    ? await tx
        .select({
          stateId: modNumJunctionTbl.taxonCharacterStateNumberId,
          modifierId: modValTbl.id,
          modifierValue: modValTbl.value,
          affixType: modValTbl.affixType,
          groupId: modGroupTbl.id,
          groupLabel: modGroupTbl.label,
          groupClass: modGroupTbl.class,
        })
        .from(modNumJunctionTbl)
        .innerJoin(modValTbl, eq(modValTbl.id, modNumJunctionTbl.modifierId))
        .innerJoin(modGroupTbl, eq(modGroupTbl.id, modValTbl.groupId))
        .where(
          inArray(modNumJunctionTbl.taxonCharacterStateNumberId, numStateIds),
        )
    : [];
  const modifiersByNumStateId = new Map<number, ModifierStateDTO[]>();
  for (const m of rawNumModRows) {
    const arr = modifiersByNumStateId.get(m.stateId) ?? [];
    arr.push({
      id: m.modifierId,
      value: m.modifierValue,
      affixType: m.affixType,
      groupId: m.groupId,
      groupLabel: m.groupLabel,
      groupClass: m.groupClass,
    });
    modifiersByNumStateId.set(m.stateId, arr);
  }

  for (const row of numRows) {
    const featuresById = byTaxon.get(row.taxonId);
    if (!featuresById) continue;

    const feature = featuresById.get(row.featureId);
    if (!feature) continue;

    const state: NumberStateDTO = {
      kind: "number",
      characterId: row.characterId,
      characterLabel: row.characterLabel,
      characterDescription: row.characterDescription,
      siBaseValue: parseFloat(row.siBaseValue),
      unit:
        row.unitId !== null
          ? {
              id: row.unitId,
              familyId: row.unitFamilyId!,
              key: row.unitKey!,
              symbol: row.unitSymbol!,
              scale: row.unitScale!,
            }
          : null,
      modifiers: modifiersByNumStateId.get(row.stateId) ?? [],
    };

    feature.states.push(state);
  }

  // Range states
  const rangeRows = await tx
    .select({
      taxonId: tfsTbl.taxonId,

      featureId: featuresTbl.id,
      stateId: rangeStateTbl.id,

      characterId: rangeStateTbl.characterId,
      characterLabel: charsTbl.label,
      characterDescription: charsTbl.description,

      siBaseMin: rangeStateTbl.siBaseMin,
      siBaseMax: rangeStateTbl.siBaseMax,

      unitId: unitsTbl.id,
      unitFamilyId: unitsTbl.familyId,
      unitKey: unitsTbl.key,
      unitSymbol: unitsTbl.symbol,
      unitScale: unitsTbl.scale,
    })
    .from(rangeStateTbl)
    .innerJoin(tfsTbl, eq(tfsTbl.id, rangeStateTbl.taxonFeatureStateId))
    .innerJoin(featuresTbl, eq(featuresTbl.id, tfsTbl.featureId))
    .innerJoin(charsTbl, eq(charsTbl.id, rangeStateTbl.characterId))
    .leftJoin(unitsTbl, eq(unitsTbl.id, rangeStateTbl.displayUnitId))
    .where(inArray(tfsTbl.taxonId, taxonIds));

  const rangeStateIds = rangeRows.map((r) => r.stateId);
  const rawRangeModRows = rangeStateIds.length
    ? await tx
        .select({
          stateId: modRangeJunctionTbl.taxonCharacterStateRangeId,
          modifierId: modValTbl.id,
          modifierValue: modValTbl.value,
          affixType: modValTbl.affixType,
          groupId: modGroupTbl.id,
          groupLabel: modGroupTbl.label,
          groupClass: modGroupTbl.class,
        })
        .from(modRangeJunctionTbl)
        .innerJoin(modValTbl, eq(modValTbl.id, modRangeJunctionTbl.modifierId))
        .innerJoin(modGroupTbl, eq(modGroupTbl.id, modValTbl.groupId))
        .where(
          inArray(
            modRangeJunctionTbl.taxonCharacterStateRangeId,
            rangeStateIds,
          ),
        )
    : [];
  const modifiersByRangeStateId = new Map<number, ModifierStateDTO[]>();
  for (const m of rawRangeModRows) {
    const arr = modifiersByRangeStateId.get(m.stateId) ?? [];
    arr.push({
      id: m.modifierId,
      value: m.modifierValue,
      affixType: m.affixType,
      groupId: m.groupId,
      groupLabel: m.groupLabel,
      groupClass: m.groupClass,
    });
    modifiersByRangeStateId.set(m.stateId, arr);
  }

  for (const row of rangeRows) {
    const featuresById = byTaxon.get(row.taxonId);
    if (!featuresById) continue;

    const feature = featuresById.get(row.featureId);
    if (!feature) continue;

    const state: RangeStateDTO = {
      kind: "range",
      characterId: row.characterId,
      characterLabel: row.characterLabel,
      characterDescription: row.characterDescription,
      siBaseMin: parseFloat(row.siBaseMin),
      siBaseMax: parseFloat(row.siBaseMax),
      unit:
        row.unitId !== null
          ? {
              id: row.unitId,
              familyId: row.unitFamilyId!,
              key: row.unitKey!,
              symbol: row.unitSymbol!,
              scale: row.unitScale!,
            }
          : null,
      modifiers: modifiersByRangeStateId.get(row.stateId) ?? [],
    };

    feature.states.push(state);
  }

  const result: TaxonStatesById = {};
  for (const [taxonId, features] of byTaxon) {
    result[taxonId] = Array.from(features.values());
  }

  return result;
}

/** Replace all feature, character, and modifier states for a taxon authoritatively. */
export async function replaceGroupedCharacterStatesForTaxon(
  tx: Transaction,
  taxonId: number,
  features: CharacterByFeatureUpdate,
): Promise<void> {
  console.log(features);
  // Load existing feature states for taxon
  const existing = await tx
    .select({
      id: tfsTbl.id,
      featureId: tfsTbl.featureId,
    })
    .from(tfsTbl)
    .where(eq(tfsTbl.taxonId, taxonId));

  const existingByFeatureId = new Map(existing.map((g) => [g.featureId, g]));

  const incomingFeatureIds = new Set(features.map((g) => g.featureId));

  // Delete feature states that are no longer present
  const featureStateIdsToDelete = existing
    .filter((g) => !incomingFeatureIds.has(g.featureId))
    .map((g) => g.id);

  if (featureStateIdsToDelete.length > 0) {
    await tx.delete(tfsTbl).where(inArray(tfsTbl.id, featureStateIdsToDelete));
  }

  // Process each incoming feature
  for (const feature of features) {
    let featureStateId: number;

    const existingFeature = existingByFeatureId.get(feature.featureId);
    if (existingFeature) {
      featureStateId = existingFeature.id;
    } else {
      const rows = await tx
        .insert(tfsTbl)
        .values({
          taxonId,
          featureId: feature.featureId,
        })
        .returning({ id: tfsTbl.id });

      if (rows.length !== 1) {
        throw new Error("Failed to create taxon feature state.");
      }

      featureStateId = rows[0]!.id;
    }

    const categorical = feature.characters.filter(
      (c): c is CategoricalCharacterUpdate => c.kind === "categorical",
    );
    const number = feature.characters.filter(
      (c): c is NumberCharacterUpdate => c.kind === "number",
    );
    const range = feature.characters.filter(
      (c): c is RangeCharacterUpdate => c.kind === "range",
    );

    await replaceCategoricalStatesForFeatureState(
      tx,
      featureStateId,
      feature.featureId,
      categorical,
    );

    await replaceNumberStatesForFeatureState(
      tx,
      featureStateId,
      feature.featureId,
      number,
    );

    await replaceRangeStatesForFeatureState(
      tx,
      featureStateId,
      feature.featureId,
      range,
    );
  }
}

/** Replace categorical states for a single taxon-feature-state. */
async function replaceCategoricalStatesForFeatureState(
  tx: Transaction,
  taxonFeatureStateId: number,
  featureId: number,
  updates: CategoricalCharacterUpdate[],
): Promise<void> {
  await tx
    .delete(catStateTbl)
    .where(eq(catStateTbl.taxonFeatureStateId, taxonFeatureStateId));

  if (updates.length === 0) return;

  // Deduplicate by characterId; last modifierIds list for a given traitValueId wins.
  const byCharacter = new Map<number, Map<number, number[]>>();
  for (const u of updates) {
    const tvMap = byCharacter.get(u.characterId) ?? new Map<number, number[]>();
    for (const tv of u.traitValues) tvMap.set(tv.id, tv.modifierIds);
    byCharacter.set(u.characterId, tvMap);
  }

  const normalized = Array.from(byCharacter.entries()).map(
    ([characterId, tvMap]) => ({
      characterId,
      traitValues: Array.from(tvMap.entries()).map(([id, modifierIds]) => ({
        id,
        modifierIds,
      })),
    }),
  );

  const characterIds = normalized.map((c) => c.characterId);

  const metas = await tx
    .select({
      characterId: catMetaTbl.characterId,
      isMultiSelect: catMetaTbl.isMultiSelect,
    })
    .from(catMetaTbl)
    .where(inArray(catMetaTbl.characterId, characterIds));

  const metaByCharacter = new Map(metas.map((m) => [m.characterId, m]));

  const allTraitValueIds = Array.from(
    new Set(normalized.flatMap((c) => c.traitValues.map((tv) => tv.id))),
  );

  const traitValueRows = await tx
    .select({
      id: catValTbl.id,
      characterId: catValTbl.characterId,
    })
    .from(catValTbl)
    .where(inArray(catValTbl.id, allTraitValueIds));

  const traitValueById = new Map(traitValueRows.map((v) => [v.id, v]));

  // Build insert rows in stable order; track modifier IDs alongside each.
  const stateRows: Array<{
    taxonFeatureStateId: number;
    characterId: number;
    traitValueId: number;
    featureId: number;
  }> = [];
  const modifierIdsByRow: number[][] = [];

  for (const c of normalized) {
    const meta = metaByCharacter.get(c.characterId);
    if (!meta) {
      throw new Error(`Character ${c.characterId} is not categorical.`);
    }

    if (!meta.isMultiSelect && c.traitValues.length > 1) {
      throw new Error(
        `Character ${c.characterId} does not allow multiple values.`,
      );
    }

    for (const tv of c.traitValues) {
      const row = traitValueById.get(tv.id);
      if (!row) throw new Error(`Unknown trait value ${tv.id}.`);

      if (row.characterId !== c.characterId) {
        throw new Error(
          `Trait value ${tv.id} does not belong to character ${c.characterId}.`,
        );
      }

      stateRows.push({
        taxonFeatureStateId,
        characterId: c.characterId,
        traitValueId: tv.id,
        featureId,
      });
      modifierIdsByRow.push(tv.modifierIds);
    }
  }

  if (stateRows.length === 0) return;

  const insertedCatStates = await tx
    .insert(catStateTbl)
    .values(stateRows)
    .returning({ id: catStateTbl.id });

  const catModJunctionRows = insertedCatStates.flatMap((state, i) =>
    modifierIdsByRow[i]!.map((modifierId) => ({
      taxonCharacterStateCategoricalId: state.id,
      modifierId,
    })),
  );

  if (catModJunctionRows.length > 0) {
    await tx.insert(modCatJunctionTbl).values(catModJunctionRows);
  }
}

/** Replace numeric single-value states for a single taxon-feature-state. */
async function replaceNumberStatesForFeatureState(
  tx: Transaction,
  taxonFeatureStateId: number,
  featureId: number,
  updates: NumberCharacterUpdate[],
): Promise<void> {
  await tx
    .delete(numStateTbl)
    .where(eq(numStateTbl.taxonFeatureStateId, taxonFeatureStateId));

  if (updates.length === 0) return;

  const byCharacter = new Map<number, NumberCharacterUpdate>();
  for (const u of updates) byCharacter.set(u.characterId, u);

  const normalized = Array.from(byCharacter.values());
  const characterIds = normalized.map((c) => c.characterId);

  const metas = await tx
    .select({
      characterId: numMetaTbl.characterId,
      unitFamilyId: numMetaTbl.unitFamilyId,
      kind: numMetaTbl.kind,
    })
    .from(numMetaTbl)
    .where(inArray(numMetaTbl.characterId, characterIds));

  const metaByCharacter = new Map(metas.map((m) => [m.characterId, m]));

  const rows = normalized.map((c) => {
    const meta = metaByCharacter.get(c.characterId);
    if (!meta || meta.kind !== "single") {
      throw new Error(
        `Character ${c.characterId} is not a single numeric character.`,
      );
    }

    return {
      taxonFeatureStateId,
      characterId: c.characterId,
      siBaseValue: c.siBaseValue.toString(),
      displayUnitId: c.unitId ?? null,
      featureId,
    };
  });

  if (rows.length > 0) {
    const insertedNumStates = await tx
      .insert(numStateTbl)
      .values(rows)
      .returning({ id: numStateTbl.id });

    const numModJunctionRows = insertedNumStates.flatMap((state, i) =>
      normalized[i]!.modifierIds.map((modifierId) => ({
        taxonCharacterStateNumberId: state.id,
        modifierId,
      })),
    );

    if (numModJunctionRows.length > 0) {
      await tx.insert(modNumJunctionTbl).values(numModJunctionRows);
    }
  }
}

// Replace numeric range states for a single taxon-feature-state.
async function replaceRangeStatesForFeatureState(
  tx: Transaction,
  taxonFeatureStateId: number,
  featureId: number,
  updates: RangeCharacterUpdate[],
): Promise<void> {
  await tx
    .delete(rangeStateTbl)
    .where(eq(rangeStateTbl.taxonFeatureStateId, taxonFeatureStateId));

  if (updates.length === 0) return;

  const byCharacter = new Map<number, RangeCharacterUpdate>();
  for (const u of updates) byCharacter.set(u.characterId, u);

  const normalized = Array.from(byCharacter.values());
  const characterIds = normalized.map((c) => c.characterId);

  const metas = await tx
    .select({
      characterId: numMetaTbl.characterId,
      unitFamilyId: numMetaTbl.unitFamilyId,
      kind: numMetaTbl.kind,
    })
    .from(numMetaTbl)
    .where(inArray(numMetaTbl.characterId, characterIds));

  const metaByCharacter = new Map(metas.map((m) => [m.characterId, m]));

  const rows = normalized.map((c) => {
    const meta = metaByCharacter.get(c.characterId);
    if (!meta || meta.kind !== "range") {
      throw new Error(`Character ${c.characterId} is not a range character.`);
    }

    if (c.siBaseMin > c.siBaseMax) {
      throw new Error(`Character ${c.characterId}: min must be <= max.`);
    }

    return {
      taxonFeatureStateId,
      characterId: c.characterId,
      siBaseMin: c.siBaseMin.toString(),
      siBaseMax: c.siBaseMax.toString(),
      displayUnitId: c.unitId ?? null,
      featureId,
    };
  });

  if (rows.length > 0) {
    const insertedRangeStates = await tx
      .insert(rangeStateTbl)
      .values(rows)
      .returning({ id: rangeStateTbl.id });

    const rangeModJunctionRows = insertedRangeStates.flatMap((state, i) =>
      normalized[i]!.modifierIds.map((modifierId) => ({
        taxonCharacterStateRangeId: state.id,
        modifierId,
      })),
    );

    if (rangeModJunctionRows.length > 0) {
      await tx.insert(modRangeJunctionTbl).values(rangeModJunctionRows);
    }
  }
}
