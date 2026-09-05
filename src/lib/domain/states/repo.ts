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
import type { Transaction } from "../../utils/types/transactionType";
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

/** Whether a description carries actual content. */
function hasText(value: string | null | undefined): boolean {
  return (value?.trim().length ?? 0) > 0;
}

/**
 * Load character states for at least one taxon.
 * Returns a map taxonId -> TaxonCharacterFeatureStateDTO[].
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
      notes: tfsTbl.notes,
      presence: tfsTbl.presence,
      featureDescription: featuresTbl.description,
      featureMediaId: featuresTbl.mediaId,
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
      featureHasInfo:
        hasText(row.featureDescription) || row.featureMediaId !== null,
      notes: row.notes,
      presence: row.presence,
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
      characterMediaId: charsTbl.mediaId,
      showInProse: charsTbl.showInProse,

      traitValueId: catStateTbl.traitValueId,
      traitValueLabel: catValTbl.label,
      traitValueDescription: catValTbl.description,
      traitValueMediaId: catValTbl.mediaId,
      traitValueHexCode: catValTbl.hexCode,
      traitSynonymSetId: catValTbl.synonymSetId,
    })
    .from(catStateTbl)
    .innerJoin(tfsTbl, eq(tfsTbl.id, catStateTbl.taxonFeatureStateId))
    .innerJoin(featuresTbl, eq(featuresTbl.id, tfsTbl.featureId))
    .innerJoin(charsTbl, eq(charsTbl.id, catStateTbl.characterId))
    .innerJoin(catValTbl, eq(catValTbl.id, catStateTbl.traitValueId))
    .where(inArray(tfsTbl.taxonId, taxonIds));

  const catStateIds = catRows.map((r) => r.stateId);
  const rawCatModRows = catStateIds.length
    ? await tx
        .select({
          stateId: modCatJunctionTbl.taxonCharacterStateCategoricalId,
          id: modValTbl.id,
          label: modValTbl.label,
          description: modValTbl.description,
          mediaId: modValTbl.mediaId,
          affixType: modValTbl.affixType,
          groupId: modGroupTbl.id,
          groupLabel: modGroupTbl.label,
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
      id: m.id,
      label: m.label,
      affixType: m.affixType,
      hasInfo: hasText(m.description) || m.mediaId !== null,
      groupId: m.groupId,
      groupLabel: m.groupLabel,
    });
    modifiersByCatStateId.set(m.stateId, arr);
  }

  for (const row of catRows) {
    const featuresById = byTaxon.get(row.taxonId);
    if (!featuresById) continue;

    const feature = featuresById.get(row.featureId);
    if (!feature) continue;

    const state: CategoricalStateDTO = {
      kind: "categorical",
      characterId: row.characterId,
      characterLabel: row.characterLabel,
      characterHasInfo:
        hasText(row.characterDescription) || row.characterMediaId !== null,
      showInProse: row.showInProse,
      trait: {
        id: row.traitValueId,
        synonymSetId: row.traitSynonymSetId,
        label: row.traitValueLabel,
        hasInfo:
          hasText(row.traitValueDescription) || row.traitValueMediaId !== null,
        hexCode: row.traitValueHexCode ?? undefined,
      },
      modifiers: modifiersByCatStateId.get(row.stateId) ?? [],
    };

    feature.states.push(state);
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
      characterMediaId: charsTbl.mediaId,
      showInProse: charsTbl.showInProse,

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
          id: modValTbl.id,
          label: modValTbl.label,
          description: modValTbl.description,
          mediaId: modValTbl.mediaId,
          affixType: modValTbl.affixType,
          groupId: modGroupTbl.id,
          groupLabel: modGroupTbl.label,
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
      id: m.id,
      label: m.label,
      affixType: m.affixType,
      hasInfo: hasText(m.description) || m.mediaId !== null,
      groupId: m.groupId,
      groupLabel: m.groupLabel,
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
      characterHasInfo:
        hasText(row.characterDescription) || row.characterMediaId !== null,
      showInProse: row.showInProse,
      siBaseValue: row.siBaseValue,
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
      characterMediaId: charsTbl.mediaId,
      showInProse: charsTbl.showInProse,

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
          id: modValTbl.id,
          label: modValTbl.label,
          description: modValTbl.description,
          mediaId: modValTbl.mediaId,
          affixType: modValTbl.affixType,
          groupId: modGroupTbl.id,
          groupLabel: modGroupTbl.label,
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
      id: m.id,
      label: m.label,
      affixType: m.affixType,
      hasInfo: hasText(m.description) || m.mediaId !== null,
      groupId: m.groupId,
      groupLabel: m.groupLabel,
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
      characterHasInfo:
        hasText(row.characterDescription) || row.characterMediaId !== null,
      showInProse: row.showInProse,
      siBaseMin: row.siBaseMin,
      siBaseMax: row.siBaseMax,
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
    const isAbsent = feature.presence === "absent";

    // The composite FK to characterizable_id enforces this too, but only as a
    // raw constraint violation. Callers get told what they did wrong instead.
    if (isAbsent && feature.characters.length > 0) {
      throw new Error(
        `Feature ${feature.featureId} is marked absent and cannot carry character states.`,
      );
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

    const replaceCharacterStates = async (featureStateId: number) => {
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
    };

    const existingFeature = existingByFeatureId.get(feature.featureId);
    if (existingFeature) {
      const featureStateId = existingFeature.id;

      const updateFeatureRow = () =>
        tx
          .update(tfsTbl)
          .set({
            notes: feature.notes,
            presence: feature.presence,
          })
          .where(eq(tfsTbl.id, featureStateId));

      // Special rules for switching presence to avoid violating FKs
      if (isAbsent) {
        await replaceCharacterStates(featureStateId);
        await updateFeatureRow();
      } else {
        await updateFeatureRow();
        await replaceCharacterStates(featureStateId);
      }
    } else {
      const rows = await tx
        .insert(tfsTbl)
        .values({
          taxonId,
          featureId: feature.featureId,
          notes: feature.notes,
          presence: feature.presence,
        })
        .returning({ id: tfsTbl.id });

      if (rows.length !== 1) {
        throw new Error("Failed to create taxon feature state.");
      }

      await replaceCharacterStates(rows[0]!.id);
    }
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

  // Deduplicate by (characterId, traitValueId, modifierSet); last wins.
  const seen = new Map<string, CategoricalCharacterUpdate>();
  for (const u of updates) {
    const sig = Array.from(new Set(u.modifierIds))
      .sort((a, b) => a - b)
      .join(",");
    seen.set(`${u.characterId}|${u.traitValueId}|${sig}`, u);
  }
  const normalized = Array.from(seen.values());

  // Count trait values per character for multi-select validation.
  const countByCharacter = new Map<number, number>();
  for (const u of normalized) {
    countByCharacter.set(
      u.characterId,
      (countByCharacter.get(u.characterId) ?? 0) + 1,
    );
  }

  const characterIds = Array.from(
    new Set(normalized.map((u) => u.characterId)),
  );

  const metas = await tx
    .select({
      characterId: catMetaTbl.characterId,
      isMultiSelect: catMetaTbl.isMultiSelect,
    })
    .from(catMetaTbl)
    .where(inArray(catMetaTbl.characterId, characterIds));

  const metaByCharacter = new Map(metas.map((m) => [m.characterId, m]));

  const allTraitValueIds = Array.from(
    new Set(normalized.map((u) => u.traitValueId)),
  );

  const traitValueRows = await tx
    .select({
      id: catValTbl.id,
      characterId: catValTbl.characterId,
      synonymSetId: catValTbl.synonymSetId,
    })
    .from(catValTbl)
    .where(inArray(catValTbl.id, allTraitValueIds));

  const traitValueById = new Map(traitValueRows.map((v) => [v.id, v]));

  const stateRows: Array<{
    taxonFeatureStateId: number;
    characterId: number;
    traitValueId: number;
    featureId: number;
    synonymSetId: number;
  }> = [];
  const modifierIdsByRow: number[][] = [];

  for (const u of normalized) {
    const meta = metaByCharacter.get(u.characterId);
    if (!meta) {
      throw new Error(`Character ${u.characterId} is not categorical.`);
    }

    if (!meta.isMultiSelect && (countByCharacter.get(u.characterId) ?? 1) > 1) {
      throw new Error(
        `Character ${u.characterId} does not allow multiple values.`,
      );
    }

    const traitValue = traitValueById.get(u.traitValueId);
    if (!traitValue) throw new Error(`Unknown trait value ${u.traitValueId}.`);

    if (traitValue.characterId !== u.characterId) {
      throw new Error(
        `Trait value ${u.traitValueId} does not belong to character ${u.characterId}.`,
      );
    }

    stateRows.push({
      taxonFeatureStateId,
      characterId: u.characterId,
      traitValueId: u.traitValueId,
      featureId,
      // Denormalised from the value we just validated above
      synonymSetId: traitValue.synonymSetId,
    });
    modifierIdsByRow.push(u.modifierIds);
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

function modifierSetSignature(modifierIds: number[]): string {
  const uniqueSorted = Array.from(new Set(modifierIds)).sort((a, b) => a - b);
  return uniqueSorted.join(",");
}

function formatModifierSet(modifierIds: number[]): string {
  const signature = modifierSetSignature(modifierIds);
  return signature.length ? signature : "none";
}

/**
 * Checks that there are no duplicate modifier sets for the same character. For example:
 * * "12 mm" + "14 mm at base" -> PASS
 * * "14 mm at apex" + "14 mm at base" -> PASS
 * * "12 mm" + "14 mm" -> FAIL
 * * "12 mm at apex" + "14 mm at apex" -> FAIL
 */
function assertNoDuplicateModifierSetsByCharacter(
  updates: Array<{ characterId: number; modifierIds: number[] }>,
  stateKindLabel: "number" | "range",
): void {
  const seen = new Set<string>();

  for (const update of updates) {
    const signature = modifierSetSignature(update.modifierIds);
    const dedupeKey = `${update.characterId}|${signature}`;

    if (seen.has(dedupeKey)) {
      throw new Error(
        `Duplicate ${stateKindLabel} state for character ${update.characterId}: a state with modifiers [${formatModifierSet(update.modifierIds)}] already exists.`,
      );
    }

    seen.add(dedupeKey);
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

  assertNoDuplicateModifierSetsByCharacter(updates, "number");

  const characterIds = Array.from(new Set(updates.map((c) => c.characterId)));

  const metas = await tx
    .select({
      characterId: numMetaTbl.characterId,
      unitFamilyId: numMetaTbl.unitFamilyId,
      kind: numMetaTbl.kind,
    })
    .from(numMetaTbl)
    .where(inArray(numMetaTbl.characterId, characterIds));

  const metaByCharacter = new Map(metas.map((m) => [m.characterId, m]));

  const rows = updates.map((c) => {
    const meta = metaByCharacter.get(c.characterId);
    if (!meta || meta.kind !== "single") {
      throw new Error(
        `Character ${c.characterId} is not a single numeric character.`,
      );
    }

    return {
      taxonFeatureStateId,
      characterId: c.characterId,
      siBaseValue: c.siBaseValue,
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
      updates[i]!.modifierIds.map((modifierId) => ({
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

  assertNoDuplicateModifierSetsByCharacter(updates, "range");

  const characterIds = Array.from(new Set(updates.map((c) => c.characterId)));

  const metas = await tx
    .select({
      characterId: numMetaTbl.characterId,
      unitFamilyId: numMetaTbl.unitFamilyId,
      kind: numMetaTbl.kind,
    })
    .from(numMetaTbl)
    .where(inArray(numMetaTbl.characterId, characterIds));

  const metaByCharacter = new Map(metas.map((m) => [m.characterId, m]));

  const rows = updates.map((c) => {
    const meta = metaByCharacter.get(c.characterId);
    if (!meta || meta.kind !== "range") {
      throw new Error(`Character ${c.characterId} is not a range character.`);
    }

    if (c.siBaseMin === null && c.siBaseMax === null) {
      throw new Error(
        `Character ${c.characterId}: at least one bound must be set.`,
      );
    }
    if (
      c.siBaseMin !== null &&
      c.siBaseMax !== null &&
      c.siBaseMin > c.siBaseMax
    ) {
      throw new Error(`Character ${c.characterId}: min must be <= max.`);
    }

    return {
      taxonFeatureStateId,
      characterId: c.characterId,
      siBaseMin: c.siBaseMin,
      siBaseMax: c.siBaseMax,
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
      updates[i]!.modifierIds.map((modifierId) => ({
        taxonCharacterStateRangeId: state.id,
        modifierId,
      })),
    );

    if (rangeModJunctionRows.length > 0) {
      await tx.insert(modRangeJunctionTbl).values(rangeModJunctionRows);
    }
  }
}
