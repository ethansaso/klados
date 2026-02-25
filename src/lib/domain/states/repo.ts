import { eq, inArray } from "drizzle-orm";
import {
  categoricalCharacterMeta as catMetaTbl,
  taxonCharacterStateCategorical as catStateTbl,
  categoricalTraitValue as catValTbl,
  character as charsTbl,
  feature as groupsTbl,
  numericCharacterMeta as numMetaTbl,
  taxonCharacterStateNumber as numStateTbl,
  taxonCharacterStateRange as rangeStateTbl,
  taxonFeatureState as tfsTbl,
  unit as unitsTbl,
} from "../../../../db/schema/schema";
import type { Transaction } from "../../utils/transactionType";
import type {
  TaxonCategoricalStateDTO,
  TaxonCharacterFeatureStateDTO,
  TaxonNumberStateDTO,
  TaxonRangeStateDTO,
} from "./types";
import type {
  CategoricalCharacterUpdate,
  CharacterByFeatureUpdate,
  NumberCharacterUpdate,
  RangeCharacterUpdate,
} from "./validation";

/** Mapping of taxon ID to TaxonCharacterFeatureStateDTO[]. */
export type TaxonStatesById = Record<string, TaxonCharacterFeatureStateDTO[]>;

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

  // Load all group states up front (including empty ones)
  const groupRows = await tx
    .select({
      taxonId: tfsTbl.taxonId,

      groupId: groupsTbl.id,
      groupLabel: groupsTbl.label,
      groupDescription: groupsTbl.description,
    })
    .from(tfsTbl)
    .innerJoin(groupsTbl, eq(groupsTbl.id, tfsTbl.featureId))
    .where(inArray(tfsTbl.taxonId, taxonIds));

  const byTaxon = new Map<number, Map<number, TaxonCharacterFeatureStateDTO>>();

  for (const row of groupRows) {
    let groupsById = byTaxon.get(row.taxonId);
    if (!groupsById) {
      groupsById = new Map();
      byTaxon.set(row.taxonId, groupsById);
    }

    groupsById.set(row.groupId, {
      featureId: row.groupId,
      featureLabel: row.groupLabel,
      featureDescription: row.groupDescription,
      states: [],
    });
  }

  // Categorical states
  const catRows = await tx
    .select({
      taxonId: tfsTbl.taxonId,

      groupId: groupsTbl.id,

      characterId: catStateTbl.characterId,
      characterLabel: charsTbl.label,
      characterDescription: charsTbl.description,

      traitValueId: catStateTbl.traitValueId,
      traitValueLabel: catValTbl.label,
      canonicalValueId: catValTbl.canonicalValueId,
    })
    .from(catStateTbl)
    .innerJoin(tfsTbl, eq(tfsTbl.id, catStateTbl.taxonFeatureStateId))
    .innerJoin(groupsTbl, eq(groupsTbl.id, tfsTbl.featureId))
    .innerJoin(charsTbl, eq(charsTbl.id, catStateTbl.characterId))
    .innerJoin(catValTbl, eq(catValTbl.id, catStateTbl.traitValueId))
    .where(inArray(tfsTbl.taxonId, taxonIds));

  const canonicalIds = Array.from(
    new Set(
      catRows.map((r) =>
        r.canonicalValueId ?? r.traitValueId,
      ),
    ),
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

  for (const row of catRows) {
    const groupsById = byTaxon.get(row.taxonId);
    if (!groupsById) continue;

    const group = groupsById.get(row.groupId);
    if (!group) continue;

    let state = group.states.find(
      (s) => s.kind === "categorical" && s.characterId === row.characterId,
    ) as TaxonCategoricalStateDTO | undefined;

    if (!state) {
      state = {
        kind: "categorical",
        characterId: row.characterId,
        characterLabel: row.characterLabel,
        characterDescription: row.characterDescription,
        traitValues: [],
      };
      group.states.push(state);
    }

    const canonicalId = row.canonicalValueId ?? row.traitValueId;

    state.traitValues.push({
      id: row.traitValueId,
      canonicalId,
      label: row.traitValueLabel,
      description: descriptionByCanonicalId.get(canonicalId) ?? "",
      hexCode: hexByCanonicalId.get(canonicalId) || undefined,
    });
  }

  // Number states
  const numRows = await tx
    .select({
      taxonId: tfsTbl.taxonId,

      groupId: groupsTbl.id,

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
    .innerJoin(groupsTbl, eq(groupsTbl.id, tfsTbl.featureId))
    .innerJoin(charsTbl, eq(charsTbl.id, numStateTbl.characterId))
    .leftJoin(unitsTbl, eq(unitsTbl.id, numStateTbl.displayUnitId))
    .where(inArray(tfsTbl.taxonId, taxonIds));

  for (const row of numRows) {
    const groupsById = byTaxon.get(row.taxonId);
    if (!groupsById) continue;

    const group = groupsById.get(row.groupId);
    if (!group) continue;

    const state: TaxonNumberStateDTO = {
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
    };

    group.states.push(state);
  }

  // Range states
  const rangeRows = await tx
    .select({
      taxonId: tfsTbl.taxonId,

      groupId: groupsTbl.id,

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
    .innerJoin(groupsTbl, eq(groupsTbl.id, tfsTbl.featureId))
    .innerJoin(charsTbl, eq(charsTbl.id, rangeStateTbl.characterId))
    .leftJoin(unitsTbl, eq(unitsTbl.id, rangeStateTbl.displayUnitId))
    .where(inArray(tfsTbl.taxonId, taxonIds));

  for (const row of rangeRows) {
    const groupsById = byTaxon.get(row.taxonId);
    if (!groupsById) continue;

    const group = groupsById.get(row.groupId);
    if (!group) continue;

    const state: TaxonRangeStateDTO = {
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
    };

    group.states.push(state);
  }

  const result: TaxonStatesById = {};
  for (const [taxonId, groups] of byTaxon) {
    result[taxonId] = Array.from(groups.values());
  }

  return result;
}

/** Replace all group + character states for a taxon authoritatively. */
export async function replaceGroupedCharacterStatesForTaxon(
  tx: Transaction,
  taxonId: number,
  features: CharacterByFeatureUpdate,
): Promise<void> {
  console.log(features);
  // Load existing group states for taxon
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
    let groupStateId: number;

    const existingGroup = existingByFeatureId.get(feature.featureId);
    if (existingGroup) {
      groupStateId = existingGroup.id;
    } else {
      const rows = await tx
        .insert(tfsTbl)
        .values({
          taxonId,
          featureId: feature.featureId,
        })
        .returning({ id: tfsTbl.id });

      if (rows.length !== 1) {
        throw new Error("Failed to create taxon group state.");
      }

      groupStateId = rows[0]!.id;
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
      groupStateId,
      feature.featureId,
      categorical,
    );

    await replaceNumberStatesForFeatureState(
      tx,
      groupStateId,
      feature.featureId,
      number,
    );

    await replaceRangeStatesForFeatureState(
      tx,
      groupStateId,
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

  const byCharacter = new Map<number, Set<number>>();
  for (const u of updates) {
    const set = byCharacter.get(u.characterId) ?? new Set<number>();
    for (const id of u.traitValueIds) set.add(id);
    byCharacter.set(u.characterId, set);
  }

  const normalized = Array.from(byCharacter.entries()).map(
    ([characterId, ids]) => ({
      characterId,
      traitValueIds: Array.from(ids),
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
    new Set(normalized.flatMap((c) => c.traitValueIds)),
  );

  const traitValues = await tx
    .select({
      id: catValTbl.id,
      characterId: catValTbl.characterId, // <-- HERE
    })
    .from(catValTbl)
    .where(inArray(catValTbl.id, allTraitValueIds));

  const traitValueById = new Map(traitValues.map((v) => [v.id, v]));

  const rows: Array<{
    taxonFeatureStateId: number;
    characterId: number;
    traitValueId: number;
    featureId: number;
  }> = [];

  for (const c of normalized) {
    const meta = metaByCharacter.get(c.characterId);
    if (!meta) {
      throw new Error(`Character ${c.characterId} is not categorical.`);
    }

    if (!meta.isMultiSelect && c.traitValueIds.length > 1) {
      throw new Error(
        `Character ${c.characterId} does not allow multiple values.`,
      );
    }

    for (const traitValueId of c.traitValueIds) {
      const tv = traitValueById.get(traitValueId);
      if (!tv) throw new Error(`Unknown trait value ${traitValueId}.`);

      if (tv.characterId !== c.characterId) {
        throw new Error(
          `Trait value ${traitValueId} does not belong to character ${c.characterId}.`,
        );
      }

      rows.push({
        taxonFeatureStateId,
        characterId: c.characterId,
        traitValueId,
        featureId,
      });
    }
  }

  if (rows.length > 0) {
    await tx.insert(catStateTbl).values(rows);
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
    await tx.insert(numStateTbl).values(rows);
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
    await tx.insert(rangeStateTbl).values(rows);
  }
}
