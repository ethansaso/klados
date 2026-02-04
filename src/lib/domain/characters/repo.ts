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
  character as charsTbl,
  characterGroup as groupsTbl,
  numericCharacterMeta as numMetaTbl,
  taxonCharacterStateCategorical as tcsCatTbl,
  taxonCharacterStateNumber as tcsNumTbl,
  taxonCharacterStateRange as tcsRangeTbl,
  taxonCharacterGroupState as tgsTbl,
  categoricalTraitSet as traitSetTbl,
  unitFamily as unitFamilyTbl,
} from "../../../../db/schema/schema";
import { likeAnywhere } from "../../utils/likeAnywhere";
import type { Transaction } from "../../utils/transactionType";
import {
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

type RawCharacterRow = {
  id: number;
  key: string;
  label: string;
  description: string;
  group: { id: number; label: string };
  usageCount: number;
  type: "categorical" | "number" | "range";
  traitSetId: number | null;
  unitFamilyId: number | null;
};

function toCharacterDTO(row: RawCharacterRow): CharacterDTO {
  const base = {
    id: row.id,
    key: row.key,
    label: row.label,
    description: row.description,
    group: row.group,
    usageCount: row.usageCount,
  };

  if (row.type === "categorical") {
    if (row.traitSetId === null) {
      throw new Error(
        `Categorical character ${row.id} is missing traitSetId in DTO conversion`,
      );
    }
    return {
      ...base,
      type: "categorical",
      characterId: row.id,
      traitSetId: row.traitSetId,
    };
  }

  if (row.unitFamilyId === null) {
    throw new Error(
      `Number character ${row.id} is missing unitFamilyId in DTO conversion`,
    );
  }

  if (row.type === "number") {
    return {
      ...base,
      type: "number",
      characterId: row.id,
      unitFamilyId: row.unitFamilyId,
    };
  }

  return {
    ...base,
    type: "range",
    characterId: row.id,
    unitFamilyId: row.unitFamilyId,
  };
}

/**
 * Fetch a single character detail by id.
 */
export async function fetchCharacterDetailById(
  id: number,
): Promise<CharacterDetailDTO | null> {
  // Fetch base character + group
  const base = await db
    .select({
      id: charsTbl.id,
      key: charsTbl.key,
      label: charsTbl.label,
      description: charsTbl.description,
      group: {
        id: groupsTbl.id,
        label: groupsTbl.label,
      },
    })
    .from(charsTbl)
    .innerJoin(groupsTbl, eq(groupsTbl.id, charsTbl.groupId))
    .where(eq(charsTbl.id, id))
    .limit(1)
    .then((rows) => rows[0]);

  if (!base) return null;

  // Check categorical metadata
  const categoricalMeta = await db
    .select({
      isMultiSelect: catMetaTbl.isMultiSelect,
      traitSet: {
        id: traitSetTbl.id,
        key: traitSetTbl.key,
        label: traitSetTbl.label,
        description: traitSetTbl.description,
      },
    })
    .from(catMetaTbl)
    .innerJoin(traitSetTbl, eq(traitSetTbl.id, catMetaTbl.traitSetId))
    .where(eq(catMetaTbl.characterId, id))
    .limit(1)
    .then((rows) => rows[0]);

  // If categorical, compute usage count and return
  if (categoricalMeta) {
    const usageCount = await db
      .select({
        count: sql<number>`count(distinct ${tgsTbl.taxonId})`,
      })
      .from(tcsCatTbl)
      .innerJoin(tgsTbl, eq(tgsTbl.id, tcsCatTbl.taxonGroupStateId))
      .where(eq(tcsCatTbl.characterId, id))
      .then((rows) => rows[0]?.count ?? 0);

    return {
      id: base.id,
      key: base.key,
      label: base.label,
      description: base.description,
      group: base.group,
      usageCount,
      characterId: base.id,
      type: "categorical",
      isMultiSelect: categoricalMeta.isMultiSelect,
      traitSet: categoricalMeta.traitSet,
    };
  }

  // Otherwise, fetch numeric / range metadata
  const numericMeta = await db
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
      ? await db
          .select({
            count: sql<number>`count(distinct ${tgsTbl.taxonId})`,
          })
          .from(tcsNumTbl)
          .innerJoin(tgsTbl, eq(tgsTbl.id, tcsNumTbl.taxonGroupStateId))
          .where(eq(tcsNumTbl.characterId, id))
          .then((rows) => rows[0]?.count ?? 0)
      : await db
          .select({
            count: sql<number>`count(distinct ${tgsTbl.taxonId})`,
          })
          .from(tcsRangeTbl)
          .innerJoin(tgsTbl, eq(tgsTbl.id, tcsRangeTbl.taxonGroupStateId))
          .where(eq(tcsRangeTbl.characterId, id))
          .then((rows) => rows[0]?.count ?? 0);

  const baseNumeric = {
    id: base.id,
    key: base.key,
    label: base.label,
    description: base.description,
    group: base.group,
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
      key: charsTbl.key,
      label: charsTbl.label,
      description: charsTbl.description,
      group: { id: groupsTbl.id, label: groupsTbl.label },

      usageCount: sql<number>`CASE
        WHEN ${characterTypeExpr} = 'categorical' THEN COALESCE(${catUsageSel.catUsageCount}, 0)
        WHEN ${characterTypeExpr} = 'number'      THEN COALESCE(${numUsageSel.numUsageCount}, 0)
        WHEN ${characterTypeExpr} = 'range'       THEN COALESCE(${rangeUsageSel.rangeUsageCount}, 0)
        ELSE 0
      END`,

      type: characterTypeExpr,
      traitSetId: catMetaTbl.traitSetId,
      unitFamilyId: numMetaTbl.unitFamilyId,
    })
    .from(charsTbl)
    .innerJoin(groupsTbl, eq(groupsTbl.id, charsTbl.groupId))
    .leftJoin(catMetaTbl, eq(catMetaTbl.characterId, charsTbl.id))
    .leftJoin(numMetaTbl, eq(numMetaTbl.characterId, charsTbl.id))
    .leftJoin(catUsageSel, eq(catUsageSel.characterId, charsTbl.id))
    .leftJoin(numUsageSel, eq(numUsageSel.characterId, charsTbl.id))
    .leftJoin(rangeUsageSel, eq(rangeUsageSel.characterId, charsTbl.id))
    .where(and(inArray(charsTbl.id, ids), hasSomeMetaExpr))
    .orderBy(
      asc(groupsTbl.label),
      asc(charsTbl.label),
      asc(charsTbl.id),
    )) as RawCharacterRow[];

  return rows.map(toCharacterDTO);
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
    like
      ? or(ilike(charsTbl.label, like), ilike(charsTbl.key, like))
      : undefined,
  ];

  const where = and(...(userFilters.filter(Boolean) as SQL[]), hasSomeMetaExpr);

  const itemsRaw = (await db
    .select({
      id: charsTbl.id,
      key: charsTbl.key,
      label: charsTbl.label,
      description: charsTbl.description,
      group: { id: groupsTbl.id, label: groupsTbl.label },

      // corruption edge-case: if multiple meta exist (shouldn't happen), sum usages
      usageCount: sql<number>`(
        COALESCE(${catUsageSel.catUsageCount}, 0) +
        COALESCE(${numUsageSel.numUsageCount}, 0) +
        COALESCE(${rangeUsageSel.rangeUsageCount}, 0)
      )`,

      type: characterTypeExpr,
      traitSetId: catMetaTbl.traitSetId,
      unitFamilyId: numMetaTbl.unitFamilyId,
    })
    .from(charsTbl)
    .innerJoin(groupsTbl, eq(groupsTbl.id, charsTbl.groupId))
    .leftJoin(catMetaTbl, eq(catMetaTbl.characterId, charsTbl.id))
    .leftJoin(numMetaTbl, eq(numMetaTbl.characterId, charsTbl.id))
    .leftJoin(catUsageSel, eq(catUsageSel.characterId, charsTbl.id))
    .leftJoin(numUsageSel, eq(numUsageSel.characterId, charsTbl.id))
    .leftJoin(rangeUsageSel, eq(rangeUsageSel.characterId, charsTbl.id))
    .where(where)
    .orderBy(asc(groupsTbl.label), asc(charsTbl.label), asc(charsTbl.id))
    .limit(pageSize)
    .offset(offset)) as RawCharacterRow[];

  const items = itemsRaw.map(toCharacterDTO);

  // Total (same predicate; all types)
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
    key: string;
    label: string;
    description: string;
    groupId: number;
  },
): Promise<{
  id: number;
  key: string;
  label: string;
  description: string;
  groupId: number;
} | null> {
  const [row] = await tx
    .insert(charsTbl)
    .values({
      key: args.key,
      label: args.label,
      description: args.description,
      groupId: args.groupId,
    })
    .returning({
      id: charsTbl.id,
      key: charsTbl.key,
      label: charsTbl.label,
      description: charsTbl.description,
      groupId: charsTbl.groupId,
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
    traitSetId: number;
    isMultiSelect: boolean;
  },
): Promise<void> {
  await tx.insert(catMetaTbl).values({
    characterId: args.characterId,
    traitSetId: args.traitSetId,
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
 * Fetch group (id + label) for a character group.
 */
export async function selectCharacterGroupById(
  tx: Transaction,
  groupId: number,
): Promise<{ id: number; label: string } | null> {
  const [row] = await tx
    .select({ id: groupsTbl.id, label: groupsTbl.label })
    .from(groupsTbl)
    .where(eq(groupsTbl.id, groupId))
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
        count: sql<number>`count(distinct ${tgsTbl.taxonId})`,
      })
      .from(tcsCatTbl)
      .innerJoin(tgsTbl, eq(tgsTbl.id, tcsCatTbl.taxonGroupStateId))
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
        count: sql<number>`count(distinct ${tgsTbl.taxonId})`,
      })
      .from(tcsNumTbl)
      .innerJoin(tgsTbl, eq(tgsTbl.id, tcsNumTbl.taxonGroupStateId))
      .where(eq(tcsNumTbl.characterId, characterId))
      .then((rows) => rows[0]);

    return row?.count ?? 0;
  }

  // range
  const row = await tx
    .select({
      count: sql<number>`count(distinct ${tgsTbl.taxonId})`,
    })
    .from(tcsRangeTbl)
    .innerJoin(tgsTbl, eq(tgsTbl.id, tcsRangeTbl.taxonGroupStateId))
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
