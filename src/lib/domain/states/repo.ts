import { eq, inArray } from "drizzle-orm";
import {
  categoricalCharacterMeta as catMetaTbl,
  taxonCharacterStateCategorical as catStateTbl,
  categoricalTraitValue as catValTbl,
  character as charsTbl,
  characterGroup as groupsTbl,
  numericCharacterMeta as numMetaTbl,
  taxonCharacterStateNumber as numStateTbl,
  taxonCharacterStateRange as rangeStateTbl,
  taxonCharacterGroupState as tgsTbl,
  unit as unitsTbl,
} from "../../../../db/schema/schema";
import type { Transaction } from "../../utils/transactionType";
import type {
  TaxonCategoricalStateDTO,
  TaxonCharacterGroupStateDTO,
  TaxonNumberStateDTO,
  TaxonRangeStateDTO,
} from "./types";
import type {
  CategoricalCharacterUpdate,
  NumberCharacterUpdate,
  RangeCharacterUpdate,
} from "./validation";

export type TaxonStatesById = Record<number, TaxonCharacterGroupStateDTO[]>;

/**
 * Load character states for at least one taxon.
 * Returns a map taxonId -> TaxonCharacterStateDTO[].
 *
 * For traitValues:
 * - label comes from the **stored** value (alias or canonical),
 * - hexCode comes from the **canonical** value (or itself if canonical).
 */
export async function selectTaxonCharacterStatesByTaxonIds(
  tx: Transaction,
  taxonIds: number[],
): Promise<TaxonStatesById> {
  if (!taxonIds.length) return {};

  // Categorical states data fetch
  const catRows = await tx
    .select({
      taxonId: tgsTbl.taxonId,
      groupStateId: tgsTbl.id,

      groupId: groupsTbl.id,
      groupLabel: groupsTbl.label,
      groupDescription: groupsTbl.description,

      characterId: catStateTbl.characterId,
      characterLabel: charsTbl.label,
      characterDescription: charsTbl.description,

      traitValueId: catStateTbl.traitValueId,
      traitValueLabel: catValTbl.label,
      isCanonical: catValTbl.isCanonical,
      canonicalValueId: catValTbl.canonicalValueId,
    })
    .from(catStateTbl)
    .innerJoin(tgsTbl, eq(tgsTbl.id, catStateTbl.taxonGroupStateId))
    .innerJoin(groupsTbl, eq(groupsTbl.id, tgsTbl.groupId))
    .innerJoin(charsTbl, eq(charsTbl.id, catStateTbl.characterId))
    .innerJoin(catValTbl, eq(catValTbl.id, catStateTbl.traitValueId))
    .where(inArray(tgsTbl.taxonId, taxonIds));

  const canonicalIds = Array.from(
    new Set(
      catRows.map((r) =>
        r.isCanonical ? r.traitValueId : (r.canonicalValueId ?? r.traitValueId),
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

  // Build categorical states
  const byTaxon = new Map<number, Map<number, TaxonCharacterGroupStateDTO>>();
  for (const row of catRows) {
    // taxon bucket
    let groupsById = byTaxon.get(row.taxonId);
    if (!groupsById) {
      groupsById = new Map();
      byTaxon.set(row.taxonId, groupsById);
    }

    // group bucket
    let group = groupsById.get(row.groupId);
    if (!group) {
      group = {
        groupId: row.groupId,
        groupLabel: row.groupLabel,
        groupDescription: row.groupDescription,
        states: [],
      };
      groupsById.set(row.groupId, group);
    }

    // character bucket inside group
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

    // canonical resolution
    const canonicalId = row.isCanonical
      ? row.traitValueId
      : (row.canonicalValueId ?? row.traitValueId);

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
      taxonId: tgsTbl.taxonId,

      groupId: groupsTbl.id,
      groupLabel: groupsTbl.label,
      groupDescription: groupsTbl.description,

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
    .innerJoin(tgsTbl, eq(tgsTbl.id, numStateTbl.taxonGroupStateId))
    .innerJoin(groupsTbl, eq(groupsTbl.id, tgsTbl.groupId))
    .innerJoin(charsTbl, eq(charsTbl.id, numStateTbl.characterId))
    .leftJoin(unitsTbl, eq(unitsTbl.id, numStateTbl.displayUnitId))
    .where(inArray(tgsTbl.taxonId, taxonIds));

  for (const row of numRows) {
    // taxon bucket
    let groupsById = byTaxon.get(row.taxonId);
    if (!groupsById) {
      groupsById = new Map();
      byTaxon.set(row.taxonId, groupsById);
    }

    // group bucket
    let group = groupsById.get(row.groupId);
    if (!group) {
      group = {
        groupId: row.groupId,
        groupLabel: row.groupLabel,
        groupDescription: row.groupDescription,
        states: [],
      };
      groupsById.set(row.groupId, group);
    }

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
      taxonId: tgsTbl.taxonId,
      groupStateId: tgsTbl.id,

      groupId: groupsTbl.id,
      groupLabel: groupsTbl.label,
      groupDescription: groupsTbl.description,

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
    .innerJoin(tgsTbl, eq(tgsTbl.id, rangeStateTbl.taxonGroupStateId))
    .innerJoin(groupsTbl, eq(groupsTbl.id, tgsTbl.groupId))
    .innerJoin(charsTbl, eq(charsTbl.id, rangeStateTbl.characterId))
    .leftJoin(unitsTbl, eq(unitsTbl.id, rangeStateTbl.displayUnitId))
    .where(inArray(tgsTbl.taxonId, taxonIds));

  for (const row of rangeRows) {
    // taxon bucket
    let groupsById = byTaxon.get(row.taxonId);
    if (!groupsById) {
      groupsById = new Map();
      byTaxon.set(row.taxonId, groupsById);
    }

    // group bucket
    let group = groupsById.get(row.groupId);
    if (!group) {
      group = {
        groupId: row.groupId,
        groupLabel: row.groupLabel,
        groupDescription: row.groupDescription,
        states: [],
      };
      groupsById.set(row.groupId, group);
    }

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

  // Convert to plain object
  const result: TaxonStatesById = {};
  for (const [taxonId, groups] of byTaxon) {
    result[taxonId] = Array.from(groups.values());
  }

  return result;
}

export async function replaceCategoricalStatesForTaxon(
  tx: Transaction,
  taxonId: number,
  updates: CategoricalCharacterUpdate[],
): Promise<void> {
  // Clear if empty
  if (updates.length === 0) {
    await tx.delete(catStateTbl).where(eq(catStateTbl.taxonId, taxonId));
    return;
  }

  // Normalize: dedupe by characterId, dedupe traitValueIds
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
      traitSetId: catMetaTbl.traitSetId,
      isMultiSelect: catMetaTbl.isMultiSelect,
    })
    .from(catMetaTbl)
    .where(inArray(catMetaTbl.characterId, characterIds));

  const metaByCharacter = new Map(metas.map((m) => [m.characterId, m]));

  for (const c of normalized) {
    if (!metaByCharacter.has(c.characterId)) {
      throw new Error(
        `Character ${c.characterId} is not categorical or does not exist.`,
      );
    }
  }

  const allTraitValueIds = Array.from(
    new Set(normalized.flatMap((c) => c.traitValueIds)),
  );

  if (allTraitValueIds.length === 0) {
    await tx.delete(catStateTbl).where(eq(catStateTbl.taxonId, taxonId));
    return;
  }

  const traitValues = await tx
    .select({
      id: catValTbl.id,
      setId: catValTbl.setId,
    })
    .from(catValTbl)
    .where(inArray(catValTbl.id, allTraitValueIds));

  const traitValueById = new Map(traitValues.map((v) => [v.id, v]));

  const rowsToInsert: Array<{
    taxonId: number;
    characterId: number;
    traitValueId: number;
  }> = [];

  for (const c of normalized) {
    const meta = metaByCharacter.get(c.characterId)!;

    if (!meta.isMultiSelect && c.traitValueIds.length > 1) {
      throw new Error(
        `Character ${c.characterId} does not allow multiple states.`,
      );
    }

    for (const traitValueId of c.traitValueIds) {
      const tv = traitValueById.get(traitValueId);
      if (!tv) throw new Error(`Unknown trait value id ${traitValueId}.`);
      if (tv.setId !== meta.traitSetId) {
        throw new Error(
          `Trait value ${traitValueId} does not belong to character ${c.characterId}.`,
        );
      }
      rowsToInsert.push({ taxonId, characterId: c.characterId, traitValueId });
    }
  }

  await tx.delete(catStateTbl).where(eq(catStateTbl.taxonId, taxonId));
  if (rowsToInsert.length) {
    await tx.insert(catStateTbl).values(rowsToInsert);
  }
}

export async function replaceNumberStatesForTaxon(
  tx: Transaction,
  taxonId: number,
  updates: NumberCharacterUpdate[],
): Promise<void> {
  // Clear if empty
  if (updates.length === 0) {
    await tx.delete(numStateTbl).where(eq(numStateTbl.taxonId, taxonId));
    return;
  }

  // Dedupe by characterId (last wins)
  const byCharacter = new Map<number, NumberCharacterUpdate>();
  for (const u of updates) {
    byCharacter.set(u.characterId, u);
  }

  const normalized = Array.from(byCharacter.values());
  const characterIds = normalized.map((c) => c.characterId);

  // Validate characters are numeric AND single kind
  const metas = await tx
    .select({
      characterId: numMetaTbl.characterId,
      unitFamilyId: numMetaTbl.unitFamilyId,
      kind: numMetaTbl.kind,
    })
    .from(numMetaTbl)
    .where(inArray(numMetaTbl.characterId, characterIds));

  const metaByCharacter = new Map(metas.map((m) => [m.characterId, m]));

  for (const c of normalized) {
    const meta = metaByCharacter.get(c.characterId);
    if (!meta) {
      throw new Error(
        `Character ${c.characterId} is not numeric or does not exist.`,
      );
    }
    if (meta.kind !== "single") {
      throw new Error(
        `Character ${c.characterId} is not a single-value numeric character.`,
      );
    }
  }

  // Validate units belong to correct families (only for updates with unitId)
  const updatesWithUnits = normalized.filter((c) => c.unitId !== undefined);
  const unitIds = updatesWithUnits.map((c) => c.unitId!);

  const unitById = new Map<number, { id: number; familyId: number }>();
  if (unitIds.length > 0) {
    const units = await tx
      .select({ id: unitsTbl.id, familyId: unitsTbl.familyId })
      .from(unitsTbl)
      .where(inArray(unitsTbl.id, unitIds));

    for (const u of units) {
      unitById.set(u.id, u);
    }
  }

  for (const c of normalized) {
    const meta = metaByCharacter.get(c.characterId)!;

    if (c.unitId !== undefined) {
      // Has unit - validate it belongs to correct family
      const unit = unitById.get(c.unitId);
      if (!unit) throw new Error(`Unknown unit id ${c.unitId}.`);

      if (unit.familyId !== meta.unitFamilyId) {
        throw new Error(
          `Unit ${c.unitId} does not belong to character ${c.characterId}'s unit family.`,
        );
      }
    }
    // If no unitId, it's dimensionless - no unit validation needed
  }

  // Replace states
  await tx.delete(numStateTbl).where(eq(numStateTbl.taxonId, taxonId));

  const rowsToInsert = normalized.map((c) => ({
    taxonId,
    characterId: c.characterId,
    displayUnitId: c.unitId ?? null,
    siBaseValue: c.siBaseValue.toString(), // Convert number to string for Postgres numeric
  }));

  if (rowsToInsert.length) {
    await tx.insert(numStateTbl).values(rowsToInsert);
  }
}

export async function replaceRangeStatesForTaxon(
  tx: Transaction,
  taxonId: number,
  updates: RangeCharacterUpdate[],
): Promise<void> {
  // Clear if empty
  if (updates.length === 0) {
    await tx.delete(rangeStateTbl).where(eq(rangeStateTbl.taxonId, taxonId));
    return;
  }

  // Dedupe by characterId (last wins)
  const byCharacter = new Map<number, RangeCharacterUpdate>();
  for (const u of updates) {
    byCharacter.set(u.characterId, u);
  }

  const normalized = Array.from(byCharacter.values());
  const characterIds = normalized.map((c) => c.characterId);

  // Validate characters are numeric AND range kind
  const metas = await tx
    .select({
      characterId: numMetaTbl.characterId,
      unitFamilyId: numMetaTbl.unitFamilyId,
      kind: numMetaTbl.kind,
    })
    .from(numMetaTbl)
    .where(inArray(numMetaTbl.characterId, characterIds));

  const metaByCharacter = new Map(metas.map((m) => [m.characterId, m]));

  for (const c of normalized) {
    const meta = metaByCharacter.get(c.characterId);
    if (!meta) {
      throw new Error(
        `Character ${c.characterId} is not numeric or does not exist.`,
      );
    }
    if (meta.kind !== "range") {
      throw new Error(`Character ${c.characterId} is not a range character.`);
    }
  }

  // Validate units belong to correct families (only for updates with unitId)
  const updatesWithUnits = normalized.filter((c) => c.unitId !== undefined);
  const unitIds = updatesWithUnits.map((c) => c.unitId!);

  const unitById = new Map<number, { id: number; familyId: number }>();
  if (unitIds.length > 0) {
    const units = await tx
      .select({ id: unitsTbl.id, familyId: unitsTbl.familyId })
      .from(unitsTbl)
      .where(inArray(unitsTbl.id, unitIds));

    for (const u of units) {
      unitById.set(u.id, u);
    }
  }

  for (const c of normalized) {
    const meta = metaByCharacter.get(c.characterId)!;

    if (c.unitId !== undefined) {
      // Has unit - validate it belongs to correct family
      const unit = unitById.get(c.unitId);
      if (!unit) throw new Error(`Unknown unit id ${c.unitId}.`);

      if (unit.familyId !== meta.unitFamilyId) {
        throw new Error(
          `Unit ${c.unitId} does not belong to character ${c.characterId}'s unit family.`,
        );
      }
    }
    // If no unitId, it's dimensionless - no unit validation needed

    // Validate min <= max
    if (c.siBaseMin > c.siBaseMax) {
      throw new Error(
        `Character ${c.characterId}: minimum value must be less than or equal to maximum value.`,
      );
    }
  }

  // Replace states
  await tx.delete(rangeStateTbl).where(eq(rangeStateTbl.taxonId, taxonId));

  const rowsToInsert = normalized.map((c) => ({
    taxonId,
    characterId: c.characterId,
    displayUnitId: c.unitId ?? null,
    siBaseMin: c.siBaseMin.toString(), // Convert to string for Postgres numeric
    siBaseMax: c.siBaseMax.toString(),
  }));

  if (rowsToInsert.length) {
    await tx.insert(rangeStateTbl).values(rowsToInsert);
  }
}
