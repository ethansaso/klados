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
  unit as unitsTbl,
} from "../../../db/schema/schema";
import { Transaction } from "../../utils/transactionType";
import {
  TaxonCategoricalStateDTO,
  TaxonCharacterStateDTO,
  TaxonNumberStateDTO,
  TaxonRangeStateDTO,
} from "./types";
import {
  CategoricalCharacterUpdate,
  NumberCharacterUpdate,
  RangeCharacterUpdate,
} from "./validation";

export type TaxonCharacterStatesByTaxonId = Record<
  number,
  TaxonCharacterStateDTO[]
>;

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
): Promise<TaxonCharacterStatesByTaxonId> {
  if (!taxonIds.length) return {};

  // Categorical states data fetch
  const catRows = await tx
    .select({
      taxonId: catStateTbl.taxonId,
      characterId: catStateTbl.characterId,
      characterLabel: charsTbl.label,
      characterDescription: charsTbl.description,
      groupId: charsTbl.groupId,
      groupLabel: groupsTbl.label,
      groupDescription: groupsTbl.description,
      traitValueId: catStateTbl.traitValueId,
      traitValueLabel: catValTbl.label,
      isCanonical: catValTbl.isCanonical,
      canonicalValueId: catValTbl.canonicalValueId,
    })
    .from(catStateTbl)
    .innerJoin(charsTbl, eq(charsTbl.id, catStateTbl.characterId))
    .innerJoin(groupsTbl, eq(groupsTbl.id, charsTbl.groupId))
    .innerJoin(catValTbl, eq(catValTbl.id, catStateTbl.traitValueId))
    .where(inArray(catStateTbl.taxonId, taxonIds));

  const canonicalIds = Array.from(
    new Set(
      catRows.map((r) =>
        r.isCanonical ? r.traitValueId : (r.canonicalValueId ?? r.traitValueId),
      ),
    ),
  );

  const canonicalRows = await tx
    .select({
      id: catValTbl.id,
      hexCode: catValTbl.hexCode,
      description: catValTbl.description,
    })
    .from(catValTbl)
    .where(inArray(catValTbl.id, canonicalIds));

  const hexByCanonicalId = new Map(canonicalRows.map((r) => [r.id, r.hexCode]));
  const descriptionByCanonicalId = new Map(
    canonicalRows.map((r) => [r.id, r.description]),
  );
  const byTaxon = new Map<number, Map<number, TaxonCharacterStateDTO>>();

  // Build categorical states
  for (const row of catRows) {
    const byCharacter =
      byTaxon.get(row.taxonId) ?? new Map<number, TaxonCharacterStateDTO>();
    byTaxon.set(row.taxonId, byCharacter);

    let state = byCharacter.get(row.characterId) as
      | TaxonCategoricalStateDTO
      | undefined;
    if (!state) {
      state = {
        kind: "categorical",
        characterId: row.characterId,
        characterLabel: row.characterLabel,
        characterDescription: row.characterDescription,
        groupId: row.groupId,
        groupLabel: row.groupLabel,
        groupDescription: row.groupDescription,
        traitValues: [],
      };
      byCharacter.set(row.characterId, state);
    }

    const canonicalId = row.isCanonical
      ? row.traitValueId
      : (row.canonicalValueId ?? row.traitValueId);

    const hexCode = hexByCanonicalId.get(canonicalId);
    const description = descriptionByCanonicalId.get(canonicalId);

    state.traitValues.push({
      id: row.traitValueId,
      canonicalId,
      label: row.traitValueLabel,
      description: description ?? "",
      hexCode: hexCode || undefined,
    });
  }

  // Number states
  const numRows = await tx
    .select({
      taxonId: numStateTbl.taxonId,
      characterId: numStateTbl.characterId,
      characterLabel: charsTbl.label,
      characterDescription: charsTbl.description,
      groupId: charsTbl.groupId,
      groupLabel: groupsTbl.label,
      groupDescription: groupsTbl.description,
      siBaseValue: numStateTbl.siBaseValue,
      unitId: unitsTbl.id,
      unitFamilyId: unitsTbl.familyId,
      unitKey: unitsTbl.key,
      unitSymbol: unitsTbl.symbol,
      unitScale: unitsTbl.scale,
    })
    .from(numStateTbl)
    .innerJoin(charsTbl, eq(charsTbl.id, numStateTbl.characterId))
    .innerJoin(groupsTbl, eq(groupsTbl.id, charsTbl.groupId))
    .leftJoin(unitsTbl, eq(unitsTbl.id, numStateTbl.displayUnitId))
    .where(inArray(numStateTbl.taxonId, taxonIds));

  for (const row of numRows) {
    const byCharacter =
      byTaxon.get(row.taxonId) ?? new Map<number, TaxonCharacterStateDTO>();
    byTaxon.set(row.taxonId, byCharacter);

    const state: TaxonNumberStateDTO = {
      kind: "number",
      characterId: row.characterId,
      characterLabel: row.characterLabel,
      characterDescription: row.characterDescription,
      groupId: row.groupId,
      groupLabel: row.groupLabel,
      groupDescription: row.groupDescription,
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
    byCharacter.set(row.characterId, state);
  }

  // Range states
  const rangeRows = await tx
    .select({
      taxonId: rangeStateTbl.taxonId,
      characterId: rangeStateTbl.characterId,
      characterLabel: charsTbl.label,
      characterDescription: charsTbl.description,
      groupId: charsTbl.groupId,
      groupLabel: groupsTbl.label,
      groupDescription: groupsTbl.description,
      siBaseMin: rangeStateTbl.siBaseMin,
      siBaseMax: rangeStateTbl.siBaseMax,
      unitId: unitsTbl.id,
      unitFamilyId: unitsTbl.familyId,
      unitKey: unitsTbl.key,
      unitSymbol: unitsTbl.symbol,
      unitScale: unitsTbl.scale,
    })
    .from(rangeStateTbl)
    .innerJoin(charsTbl, eq(charsTbl.id, rangeStateTbl.characterId))
    .innerJoin(groupsTbl, eq(groupsTbl.id, charsTbl.groupId))
    .leftJoin(unitsTbl, eq(unitsTbl.id, rangeStateTbl.displayUnitId))
    .where(inArray(rangeStateTbl.taxonId, taxonIds));

  for (const row of rangeRows) {
    const byCharacter =
      byTaxon.get(row.taxonId) ?? new Map<number, TaxonCharacterStateDTO>();
    byTaxon.set(row.taxonId, byCharacter);

    const state: TaxonRangeStateDTO = {
      kind: "range",
      characterId: row.characterId,
      characterLabel: row.characterLabel,
      characterDescription: row.characterDescription,
      groupId: row.groupId,
      groupLabel: row.groupLabel,
      groupDescription: row.groupDescription,
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
    byCharacter.set(row.characterId, state);
  }

  // Convert to plain object
  const result: TaxonCharacterStatesByTaxonId = {};
  for (const [taxonId, byCharacter] of byTaxon) {
    result[taxonId] = Array.from(byCharacter.values());
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
