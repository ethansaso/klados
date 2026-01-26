import {
  and,
  asc,
  count,
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
  categoricalTraitSet as traitSetTbl,
  unitFamily as unitFamilyTbl,
  taxonCharacterStateCategorical as valCatTbl,
  taxonCharacterStateNumber as valNumTbl,
  taxonCharacterStateRange as valRangeTbl,
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
  // Get categorical row first
  const catRow = await db
    .select({
      type: sql<"categorical">`'categorical'`,
      id: charsTbl.id,
      key: charsTbl.key,
      label: charsTbl.label,
      description: charsTbl.description,
      group: { id: groupsTbl.id, label: groupsTbl.label },

      usageCount: sql<number>`COUNT(DISTINCT ${valCatTbl.taxonId})`,

      isMultiSelect: catMetaTbl.isMultiSelect,
      traitSet: {
        id: traitSetTbl.id,
        key: traitSetTbl.key,
        label: traitSetTbl.label,
        description: traitSetTbl.description,
      },
    })
    .from(charsTbl)
    .innerJoin(catMetaTbl, eq(catMetaTbl.characterId, charsTbl.id))
    .innerJoin(groupsTbl, eq(groupsTbl.id, charsTbl.groupId))
    .innerJoin(traitSetTbl, eq(traitSetTbl.id, catMetaTbl.traitSetId))
    .leftJoin(valCatTbl, eq(valCatTbl.characterId, charsTbl.id))
    .where(eq(charsTbl.id, id))
    .groupBy(
      charsTbl.id,
      charsTbl.key,
      charsTbl.label,
      charsTbl.description,
      groupsTbl.id,
      groupsTbl.label,
      catMetaTbl.isMultiSelect,
      traitSetTbl.id,
      traitSetTbl.key,
      traitSetTbl.label,
      traitSetTbl.description,
    )
    .limit(1)
    .then((rows) => rows[0]);

  // 1) Found categorical row; return it
  if (catRow) {
    return {
      id: catRow.id,
      key: catRow.key,
      label: catRow.label,
      description: catRow.description,
      group: catRow.group,
      usageCount: catRow.usageCount,
      type: "categorical",
      characterId: catRow.id,
      isMultiSelect: catRow.isMultiSelect,
      traitSet: catRow.traitSet,
    };
  }

  // 2) Not categorical; try number/range
  const numRow = await db
    .select({
      type: sql<"number" | "range">`CASE
        WHEN ${numMetaTbl.kind} = 'single' THEN 'number'
        ELSE 'range'
      END`,
      id: charsTbl.id,
      key: charsTbl.key,
      label: charsTbl.label,
      description: charsTbl.description,
      group: { id: groupsTbl.id, label: groupsTbl.label },

      // Usage count depends on kind; count distinct taxa in the correct state table.
      usageCount: sql<number>`CASE
        WHEN ${numMetaTbl.kind} = 'single' THEN COUNT(DISTINCT ${valNumTbl.taxonId})
        ELSE COUNT(DISTINCT ${valRangeTbl.taxonId})
      END`,

      unitFamily: {
        id: unitFamilyTbl.id,
        label: unitFamilyTbl.label,
      },
    })
    .from(charsTbl)
    .innerJoin(numMetaTbl, eq(numMetaTbl.characterId, charsTbl.id))
    .innerJoin(groupsTbl, eq(groupsTbl.id, charsTbl.groupId))
    .innerJoin(unitFamilyTbl, eq(unitFamilyTbl.id, numMetaTbl.unitFamilyId))
    .leftJoin(valNumTbl, eq(valNumTbl.characterId, charsTbl.id))
    .leftJoin(valRangeTbl, eq(valRangeTbl.characterId, charsTbl.id))
    .where(eq(charsTbl.id, id))
    .groupBy(
      charsTbl.id,
      charsTbl.key,
      charsTbl.label,
      charsTbl.description,
      groupsTbl.id,
      groupsTbl.label,
      numMetaTbl.kind,
      unitFamilyTbl.id,
      unitFamilyTbl.label,
    )
    .limit(1)
    .then((rows) => rows[0]);

  // If neither, simply return null
  if (!numRow) return null;

  // DTO formation
  const base = {
    id: numRow.id,
    key: numRow.key,
    label: numRow.label,
    description: numRow.description,
    group: numRow.group,
    usageCount: numRow.usageCount,
    characterId: numRow.id,
    unitFamily: numRow.unitFamily,
  };

  if (numRow.type === "number") {
    return { ...base, type: "number" };
  }

  return { ...base, type: "range" };
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

  const totals = await db
    .select({ total: count() })
    .from(groupsTbl)
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
  const [row] = await tx
    .select({
      existsId: charsTbl.id,

      usageCount: sql<number>`CASE
        WHEN ${catMetaTbl.characterId} IS NOT NULL THEN COUNT(DISTINCT ${valCatTbl.taxonId})
        WHEN ${numMetaTbl.kind} = 'single'        THEN COUNT(DISTINCT ${valNumTbl.taxonId})
        WHEN ${numMetaTbl.kind} = 'range'         THEN COUNT(DISTINCT ${valRangeTbl.taxonId})
        ELSE 0
      END`,
    })
    .from(charsTbl)
    .leftJoin(catMetaTbl, eq(catMetaTbl.characterId, charsTbl.id))
    .leftJoin(numMetaTbl, eq(numMetaTbl.characterId, charsTbl.id))
    .leftJoin(valCatTbl, eq(valCatTbl.characterId, charsTbl.id))
    .leftJoin(valNumTbl, eq(valNumTbl.characterId, charsTbl.id))
    .leftJoin(valRangeTbl, eq(valRangeTbl.characterId, charsTbl.id))
    .where(eq(charsTbl.id, characterId))
    .groupBy(charsTbl.id, catMetaTbl.characterId, numMetaTbl.kind)
    .limit(1);

  if (!row) return null;
  return Number(row.usageCount ?? 0);
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
