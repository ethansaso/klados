import {
  and,
  asc,
  countDistinct,
  eq,
  ilike,
  inArray,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "../../../../db/client";
import {
  categoricalCharacterMeta as catMetaTbl,
  characterFeature as characterFeatureTbl,
  character as charsTbl,
  feature as featuresTbl,
  numericCharacterMeta as numMetaTbl,
  taxonCharacterStateCategorical as tcsCatTbl,
  taxonCharacterStateNumber as tcsNumTbl,
  taxonCharacterStateRange as tcsRangeTbl,
  taxonFeatureState as tfsTbl,
  unitFamily as unitFamilyTbl,
} from "../../../../db/schema/schema";
import { likeAnywhere } from "../../utils/likeAnywhere";
import type { Transaction, TxOrDb } from "../../utils/transactionType";
import {
  catTraitCountSel,
  catUsageSel,
  characterTypeExpr,
  hasSomeMetaExpr,
  numUsageSel,
  rangeUsageSel,
} from "./selectors";
import type {
  CharacterDetailDTO,
  CharacterDTO,
  CharacterPaginatedResult,
} from "./types";

/** Represents a single pairing of character and feature. */
type RawCharacterRow = {
  id: number;
  key: string;
  label: string;
  description: string;
  feature: { id: number; label: string };
  usageCount: number;
  type: "categorical" | "number" | "range";
  traitCount: number | null;
  unitFamilyId: number | null;
};

function groupRowsToCharacterDTOs(rows: RawCharacterRow[]): CharacterDTO[] {
  const byId = new Map<number, CharacterDTO>();

  for (const row of rows) {
    let existing = byId.get(row.id);

    if (!existing) {
      const base = {
        id: row.id,
        key: row.key,
        label: row.label,
        description: row.description,
        features: row.feature ? [row.feature] : [],
        usageCount: row.usageCount,
      };

      if (row.type === "categorical") {
        existing = {
          ...base,
          type: "categorical",
          characterId: row.id,
          traitCount: row.traitCount ?? 0,
        };
      } else {
        if (row.unitFamilyId === null) {
          throw new Error(
            `Numeric character ${row.id} is missing unitFamilyId`,
          );
        }

        existing =
          row.type === "number"
            ? {
                ...base,
                type: "number",
                characterId: row.id,
                unitFamilyId: row.unitFamilyId,
              }
            : {
                ...base,
                type: "range",
                characterId: row.id,
                unitFamilyId: row.unitFamilyId,
              };
      }

      byId.set(row.id, existing);
    } else {
      // Push additional feature
      existing.features.push(row.feature);
    }
  }

  return Array.from(byId.values());
}

/**
 * Fetch a single character detail by id.
 */
/**
 * Fetch a single character detail by id.
 */
export async function fetchCharacterDetailById(
  tx: TxOrDb,
  id: number,
): Promise<CharacterDetailDTO | null> {
  // Fetch base character
  const base = await tx
    .select({
      id: charsTbl.id,
      label: charsTbl.label,
      description: charsTbl.description,
    })
    .from(charsTbl)
    .where(eq(charsTbl.id, id))
    .limit(1)
    .then((rows) => rows[0]);

  if (!base) return null;

  // Fetch features for character
  const features = await tx
    .select({
      id: featuresTbl.id,
      label: featuresTbl.label,
    })
    .from(characterFeatureTbl)
    .innerJoin(featuresTbl, eq(featuresTbl.id, characterFeatureTbl.featureId))
    .where(eq(characterFeatureTbl.characterId, id))
    .orderBy(asc(featuresTbl.label), asc(featuresTbl.id));

  // Check categorical metadata
  const categoricalMeta = await tx
    .select({
      isMultiSelect: catMetaTbl.isMultiSelect,
    })
    .from(catMetaTbl)
    .where(eq(catMetaTbl.characterId, id))
    .limit(1)
    .then((rows) => rows[0]);

  // If categorical, compute usage count and return
  if (categoricalMeta) {
    const usageCount = await tx
      .select({
        count: sql<number>`count(distinct ${tfsTbl.taxonId})`,
      })
      .from(tcsCatTbl)
      .innerJoin(tfsTbl, eq(tfsTbl.id, tcsCatTbl.taxonFeatureStateId))
      .where(eq(tcsCatTbl.characterId, id))
      .then((rows) => rows[0]?.count ?? 0);

    return {
      id: base.id,
      label: base.label,
      description: base.description,
      features,
      usageCount,
      characterId: base.id,
      type: "categorical",
      isMultiSelect: categoricalMeta.isMultiSelect,
    };
  }

  // Otherwise, fetch numeric / range metadata
  const numericMeta = await tx
    .select({
      kind: numMetaTbl.kind, // 'single' | 'range'
      unitFamily: {
        id: unitFamilyTbl.id,
        label: unitFamilyTbl.label,
      },
    })
    .from(numMetaTbl)
    .innerJoin(unitFamilyTbl, eq(unitFamilyTbl.id, numMetaTbl.unitFamilyId))
    .where(eq(numMetaTbl.characterId, id))
    .limit(1)
    .then((rows) => rows[0]);

  if (!numericMeta) return null;

  // Compute usage count based on numeric kind
  const usageCount =
    numericMeta.kind === "single"
      ? await tx
          .select({
            count: sql<number>`count(distinct ${tfsTbl.taxonId})`,
          })
          .from(tcsNumTbl)
          .innerJoin(tfsTbl, eq(tfsTbl.id, tcsNumTbl.taxonFeatureStateId))
          .where(eq(tcsNumTbl.characterId, id))
          .then((rows) => rows[0]?.count ?? 0)
      : await tx
          .select({
            count: sql<number>`count(distinct ${tfsTbl.taxonId})`,
          })
          .from(tcsRangeTbl)
          .innerJoin(tfsTbl, eq(tfsTbl.id, tcsRangeTbl.taxonFeatureStateId))
          .where(eq(tcsRangeTbl.characterId, id))
          .then((rows) => rows[0]?.count ?? 0);

  const baseNumeric = {
    id: base.id,
    label: base.label,
    description: base.description,
    features,
    usageCount,
    characterId: base.id,
    unitFamily: numericMeta.unitFamily,
  };

  // Return number or range DTO
  return numericMeta.kind === "single"
    ? { ...baseNumeric, type: "number" }
    : { ...baseNumeric, type: "range" };
}

/**
 * Select multiple characters by their IDs within a transaction.
 */
export async function selectCharactersByIds(
  tx: Transaction,
  ids: number[],
): Promise<CharacterDTO[]> {
  if (!ids.length) return [];

  const rows = (await tx
    .select({
      id: charsTbl.id,
      label: charsTbl.label,
      description: charsTbl.description,
      feature: { id: featuresTbl.id, label: featuresTbl.label },

      usageCount: sql<number>`CASE
        WHEN ${characterTypeExpr} = 'categorical' THEN COALESCE(${catUsageSel.catUsageCount}, 0)
        WHEN ${characterTypeExpr} = 'number'      THEN COALESCE(${numUsageSel.numUsageCount}, 0)
        WHEN ${characterTypeExpr} = 'range'       THEN COALESCE(${rangeUsageSel.rangeUsageCount}, 0)
        ELSE 0
      END`,

      type: characterTypeExpr,
      unitFamilyId: numMetaTbl.unitFamilyId,

      traitCount: catTraitCountSel.traitCount,
    })
    .from(charsTbl)
    .leftJoin(
      characterFeatureTbl,
      eq(characterFeatureTbl.characterId, charsTbl.id),
    )
    .leftJoin(featuresTbl, eq(featuresTbl.id, characterFeatureTbl.featureId))
    .leftJoin(catMetaTbl, eq(catMetaTbl.characterId, charsTbl.id))
    .leftJoin(numMetaTbl, eq(numMetaTbl.characterId, charsTbl.id))
    .leftJoin(catUsageSel, eq(catUsageSel.characterId, charsTbl.id))
    .leftJoin(numUsageSel, eq(numUsageSel.characterId, charsTbl.id))
    .leftJoin(rangeUsageSel, eq(rangeUsageSel.characterId, charsTbl.id))
    .leftJoin(catTraitCountSel, eq(catTraitCountSel.characterId, charsTbl.id))
    .where(and(inArray(charsTbl.id, ids), hasSomeMetaExpr))
    .orderBy(
      asc(featuresTbl.label),
      asc(charsTbl.label),
      asc(charsTbl.id),
    )) as RawCharacterRow[];

  return groupRowsToCharacterDTOs(rows);
}

/**
 * List characters with optional search and ids, paginated.
 */
export async function listCharactersQuery(args: {
  q?: string;
  ids?: number[];
  page: number;
  pageSize: number;
}): Promise<CharacterPaginatedResult> {
  const { q, ids, page, pageSize } = args;
  const offset = (page - 1) * pageSize;

  const like = likeAnywhere(q);

  const userFilters: (SQL | undefined)[] = [
    ids && ids.length ? inArray(charsTbl.id, ids) : undefined,
    like ? or(ilike(charsTbl.label, like)) : undefined,
  ];

  const filtered = userFilters.filter(Boolean) as SQL[];
  const where = filtered.length
    ? and(...filtered, hasSomeMetaExpr)
    : hasSomeMetaExpr;

  // STEP 1: paginate at character level
  const paginatedCharacterIds = await db
    .select({ id: charsTbl.id })
    .from(charsTbl)
    .leftJoin(catMetaTbl, eq(catMetaTbl.characterId, charsTbl.id))
    .leftJoin(numMetaTbl, eq(numMetaTbl.characterId, charsTbl.id))
    .where(where)
    .groupBy(charsTbl.id)
    // order for pagination sorting guarantees
    .orderBy(asc(charsTbl.label), asc(charsTbl.id))
    .limit(pageSize)
    .offset(offset);

  const characterIds = paginatedCharacterIds.map((r) => r.id);

  let items: CharacterDTO[] = [];

  if (characterIds.length) {
    const rows = (await db
      .select({
        id: charsTbl.id,
        label: charsTbl.label,
        description: charsTbl.description,
        feature: { id: featuresTbl.id, label: featuresTbl.label },

        usageCount: sql<number>`(
          COALESCE(${catUsageSel.catUsageCount}, 0) +
          COALESCE(${numUsageSel.numUsageCount}, 0) +
          COALESCE(${rangeUsageSel.rangeUsageCount}, 0)
        )`,

        type: characterTypeExpr,
        unitFamilyId: numMetaTbl.unitFamilyId,

        traitCount: catTraitCountSel.traitCount,
      })
      .from(charsTbl)
      .leftJoin(
        characterFeatureTbl,
        eq(characterFeatureTbl.characterId, charsTbl.id),
      )
      .leftJoin(featuresTbl, eq(featuresTbl.id, characterFeatureTbl.featureId))
      .leftJoin(catMetaTbl, eq(catMetaTbl.characterId, charsTbl.id))
      .leftJoin(numMetaTbl, eq(numMetaTbl.characterId, charsTbl.id))
      .leftJoin(catUsageSel, eq(catUsageSel.characterId, charsTbl.id))
      .leftJoin(numUsageSel, eq(numUsageSel.characterId, charsTbl.id))
      .leftJoin(rangeUsageSel, eq(rangeUsageSel.characterId, charsTbl.id))
      .leftJoin(catTraitCountSel, eq(catTraitCountSel.characterId, charsTbl.id))
      .where(inArray(charsTbl.id, characterIds))
      // order for consistent ordering with pagination step
      .orderBy(
        asc(charsTbl.label),
        asc(featuresTbl.label),
        asc(charsTbl.id),
      )) as RawCharacterRow[];

    items = groupRowsToCharacterDTOs(rows);
  }

  // STEP 2: total character count
  const totals = await db
    .select({ total: countDistinct(charsTbl.id) })
    .from(charsTbl)
    .leftJoin(catMetaTbl, eq(catMetaTbl.characterId, charsTbl.id))
    .leftJoin(numMetaTbl, eq(numMetaTbl.characterId, charsTbl.id))
    .where(where);

  const total = totals[0]?.total ?? 0;

  return {
    items,
    page,
    pageSize,
    total,
  };
}

/**
 * Insert a character row (meta must be inserted separately).
 */
export async function insertCharacter(
  tx: Transaction,
  args: {
    label: string;
    description: string;
  },
): Promise<{
  id: number;
  label: string;
  description: string;
} | null> {
  const [row] = await tx
    .insert(charsTbl)
    .values({
      label: args.label,
      description: args.description,
    })
    .returning({
      id: charsTbl.id,
      label: charsTbl.label,
      description: charsTbl.description,
    });

  return row ?? null;
}

/**
 * Insert categorical meta for a character.
 */
export async function insertCategoricalMeta(
  tx: Transaction,
  args: {
    characterId: number;
    isMultiSelect: boolean;
  },
): Promise<void> {
  await tx.insert(catMetaTbl).values({
    characterId: args.characterId,
    isMultiSelect: args.isMultiSelect,
  });
}

/**
 * Insert numeric meta for a character.
 * * kind: 'single' => DTO type 'number'
 * * kind: 'range'  => DTO type 'range'
 */
export async function insertNumericMeta(
  tx: Transaction,
  args: {
    characterId: number;
    unitFamilyId: number;
    kind: "single" | "range";
  },
): Promise<void> {
  await tx.insert(numMetaTbl).values({
    characterId: args.characterId,
    unitFamilyId: args.unitFamilyId,
    kind: args.kind,
  });
}

/**
 * Fetch feature (id + label) for a character feature.
 */
export async function selectFeatureById(
  tx: Transaction,
  featureId: number,
): Promise<{ id: number; label: string } | null> {
  const [row] = await tx
    .select({ id: featuresTbl.id, label: featuresTbl.label })
    .from(featuresTbl)
    .where(eq(featuresTbl.id, featureId))
    .limit(1);

  return row ?? null;
}

/**
 * Count usage for a character across the correct state table, based on the character's meta.
 * Returns count, or null if not found.
 */
export async function countUsageForCharacter(
  tx: Transaction,
  characterId: number,
): Promise<number | null> {
  // Ensure character exists
  const exists = await tx
    .select({ id: charsTbl.id })
    .from(charsTbl)
    .where(eq(charsTbl.id, characterId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!exists) return null;

  // Check categorical
  const categorical = await tx
    .select({ id: catMetaTbl.characterId })
    .from(catMetaTbl)
    .where(eq(catMetaTbl.characterId, characterId))
    .limit(1)
    .then((rows) => rows[0]);

  if (categorical) {
    const row = await tx
      .select({
        count: sql<number>`count(distinct ${tfsTbl.taxonId})`,
      })
      .from(tcsCatTbl)
      .innerJoin(tfsTbl, eq(tfsTbl.id, tcsCatTbl.taxonFeatureStateId))
      .where(eq(tcsCatTbl.characterId, characterId))
      .then((rows) => rows[0]);

    return row?.count ?? 0;
  }

  // Check numeric (single or range)
  const numericMeta = await tx
    .select({
      kind: numMetaTbl.kind, // 'single' | 'range'
    })
    .from(numMetaTbl)
    .where(eq(numMetaTbl.characterId, characterId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!numericMeta) {
    // Character exists but has no meta (shouldn't happen, but be safe)
    return 0;
  }

  if (numericMeta.kind === "single") {
    const row = await tx
      .select({
        count: sql<number>`count(distinct ${tfsTbl.taxonId})`,
      })
      .from(tcsNumTbl)
      .innerJoin(tfsTbl, eq(tfsTbl.id, tcsNumTbl.taxonFeatureStateId))
      .where(eq(tcsNumTbl.characterId, characterId))
      .then((rows) => rows[0]);

    return row?.count ?? 0;
  }

  // range
  const row = await tx
    .select({
      count: sql<number>`count(distinct ${tfsTbl.taxonId})`,
    })
    .from(tcsRangeTbl)
    .innerJoin(tfsTbl, eq(tfsTbl.id, tcsRangeTbl.taxonFeatureStateId))
    .where(eq(tcsRangeTbl.characterId, characterId))
    .then((rows) => rows[0]);

  return row?.count ?? 0;
}

/**
 * Delete a character by id; returns the deleted id or null if nothing deleted.
 */
export async function deleteCharacterById(
  tx: Transaction,
  characterId: number,
): Promise<{ id: number } | null> {
  const [deleted] = await tx
    .delete(charsTbl)
    .where(eq(charsTbl.id, characterId))
    .returning({ id: charsTbl.id });

  return deleted ?? null;
}

/**
 * Update the base character row (key, label, description).
 * Returns null when the character doesn't exist.
 */
export async function updateCharacterBase(
  tx: Transaction,
  id: number,
  values: Partial<{ label: string; description: string }>,
): Promise<{
  id: number;
  label: string;
  description: string;
} | null> {
  // Nothing to set → just verify existence
  if (!Object.keys(values).length) {
    const [existing] = await tx
      .select({
        id: charsTbl.id,
        label: charsTbl.label,
        description: charsTbl.description,
      })
      .from(charsTbl)
      .where(eq(charsTbl.id, id))
      .limit(1);
    return existing ?? null;
  }

  const [row] = await tx
    .update(charsTbl)
    .set(values)
    .where(eq(charsTbl.id, id))
    .returning({
      id: charsTbl.id,
      label: charsTbl.label,
      description: charsTbl.description,
    });

  return row ?? null;
}

/**
 * Update the `isMultiSelect` flag on categorical character meta.
 */
export async function updateCategoricalMeta(
  tx: Transaction,
  characterId: number,
  isMultiSelect: boolean,
): Promise<void> {
  await tx
    .update(catMetaTbl)
    .set({ isMultiSelect })
    .where(eq(catMetaTbl.characterId, characterId));
}
