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
import { db } from "../../../db/client";
import {
  categoricalCharacterMeta as catMetaTbl,
  character as charsTbl,
  characterGroup as groupsTbl,
  categoricalTraitSet as traitSetTbl,
  taxonCharacterStateCategorical as valCatTbl,
} from "../../../db/schema/schema";
import { Transaction } from "../../utils/transactionType";
import type {
  CharacterDetailDTO,
  CharacterDTO,
  CharacterPaginatedResult,
} from "./types";

/**
 * Fetch a single character detail by id.
 * TODO: add more than categorical
 */
export async function fetchCharacterDetailById(
  id: number
): Promise<CharacterDetailDTO | null> {
  const row = await db
    .select({
      id: charsTbl.id,
      key: charsTbl.key,
      label: charsTbl.label,
      description: charsTbl.description,
      group: {
        id: groupsTbl.id,
        label: groupsTbl.label,
      },
      usageCount: sql<number>`COUNT(${valCatTbl.id})`,

      // categorical meta
      type: sql<"categorical">`'categorical'`,
      characterId: charsTbl.id,
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
      catMetaTbl.traitSetId,
      traitSetTbl.id,
      traitSetTbl.key,
      traitSetTbl.label,
      traitSetTbl.description,
      catMetaTbl.isMultiSelect
    )
    .limit(1)
    .then((rows) => rows[0]);

  return row ?? null;
}

/**
 * Select multiple characters by their IDs within a transaction.
 * TODO: add more than categorical
 */
export async function selectCharactersByIds(
  tx: Transaction,
  ids: number[]
): Promise<CharacterDTO[]> {
  if (!ids.length) {
    return [];
  }

  const rows: CharacterDTO[] = await tx
    .select({
      id: charsTbl.id,
      key: charsTbl.key,
      label: charsTbl.label,
      description: charsTbl.description,
      groupId: charsTbl.groupId,
      group: {
        id: groupsTbl.id,
        label: groupsTbl.label,
      },
      usageCount: sql<number>`COUNT(${valCatTbl.id})`,
      type: sql<"categorical">`'categorical'`,
      characterId: charsTbl.id,
      traitSetId: catMetaTbl.traitSetId,
    })
    .from(charsTbl)
    .innerJoin(catMetaTbl, eq(catMetaTbl.characterId, charsTbl.id))
    .innerJoin(groupsTbl, eq(groupsTbl.id, charsTbl.groupId))
    .leftJoin(valCatTbl, eq(valCatTbl.characterId, charsTbl.id))
    .where(inArray(charsTbl.id, ids))
    .groupBy(
      charsTbl.id,
      charsTbl.key,
      charsTbl.label,
      charsTbl.description,
      charsTbl.groupId,
      groupsTbl.id,
      groupsTbl.label,
      catMetaTbl.traitSetId
    )
    .orderBy(asc(groupsTbl.label), asc(charsTbl.label), asc(charsTbl.id));

  return rows;
}

/**
 * List characters with optional search and ids, paginated.
 * TODO: add more than categorical
 */
export async function listCharactersQuery(args: {
  q?: string;
  ids?: number[];
  page: number;
  pageSize: number;
}): Promise<CharacterPaginatedResult> {
  const { q, ids, page, pageSize } = args;
  const offset = (page - 1) * pageSize;

  const rawQ = q?.trim();
  const likeAnywhere =
    rawQ && rawQ.length ? `%${rawQ.replace(/([%_\\])/g, "\\$1")}%` : undefined;

  const filters: (SQL | undefined)[] = [
    ids && ids.length ? inArray(charsTbl.id, ids) : undefined,
    likeAnywhere
      ? or(
          ilike(charsTbl.label, likeAnywhere),
          ilike(charsTbl.key, likeAnywhere)
        )
      : undefined,
  ];

  const where = and(...(filters.filter(Boolean) as SQL[]));

  // Items: restrict to categorical by inner-joining cat meta.
  const items: CharacterDTO[] = await db
    .select({
      id: charsTbl.id,
      key: charsTbl.key,
      label: charsTbl.label,
      description: charsTbl.description,
      groupId: charsTbl.groupId,
      group: {
        id: groupsTbl.id,
        label: groupsTbl.label,
      },
      usageCount: sql<number>`COUNT(${valCatTbl.id})`,
      // categorical meta
      type: sql<"categorical">`'categorical'`,
      characterId: charsTbl.id,
      traitSetId: catMetaTbl.traitSetId,
    })
    .from(charsTbl)
    .innerJoin(catMetaTbl, eq(catMetaTbl.characterId, charsTbl.id))
    .innerJoin(groupsTbl, eq(groupsTbl.id, charsTbl.groupId))
    .leftJoin(valCatTbl, eq(valCatTbl.characterId, charsTbl.id))
    .where(where)
    .groupBy(
      charsTbl.id,
      charsTbl.key,
      charsTbl.label,
      charsTbl.description,
      charsTbl.groupId,
      groupsTbl.id,
      groupsTbl.label,
      catMetaTbl.traitSetId
    )
    .orderBy(asc(groupsTbl.label), asc(charsTbl.label), asc(charsTbl.id))
    .limit(pageSize)
    .offset(offset);

  // Total (same predicate; categorical only)
  const [{ total }] = await db
    .select({ total: count() })
    .from(charsTbl)
    .innerJoin(catMetaTbl, eq(catMetaTbl.characterId, charsTbl.id))
    .where(where);

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
  }
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
  }
): Promise<void> {
  await tx.insert(catMetaTbl).values({
    characterId: args.characterId,
    traitSetId: args.traitSetId,
    isMultiSelect: args.isMultiSelect,
  });
}

/**
 * Fetch group (id + label) for a character group.
 */
export async function selectCharacterGroupById(
  tx: Transaction,
  groupId: number
): Promise<{ id: number; label: string } | null> {
  const [row] = await tx
    .select({ id: groupsTbl.id, label: groupsTbl.label })
    .from(groupsTbl)
    .where(eq(groupsTbl.id, groupId))
    .limit(1);

  return row ?? null;
}

/**
 * Count categorical usage of a character across taxon states.
 */
export async function countCategoricalUsageForCharacter(
  tx: Transaction,
  characterId: number
): Promise<number> {
  const [{ count: categoricalCount }] = await tx
    .select({ count: count() })
    .from(valCatTbl)
    .where(eq(valCatTbl.characterId, characterId));

  return Number(categoricalCount ?? 0);
}

/**
 * Delete a character by id; returns the deleted id or null if nothing deleted.
 */
export async function deleteCharacterById(
  tx: Transaction,
  characterId: number
): Promise<{ id: number } | null> {
  const [deleted] = await tx
    .delete(charsTbl)
    .where(eq(charsTbl.id, characterId))
    .returning({ id: charsTbl.id });

  return deleted ?? null;
}
