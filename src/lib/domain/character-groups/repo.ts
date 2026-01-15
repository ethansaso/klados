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
  numericCharacterMeta as numMetaTbl,
} from "../../../db/schema/schema";
import { Transaction } from "../../utils/transactionType";
import type {
  CharacterGroupDTO,
  CharacterGroupDetailDTO,
  CharacterGroupPaginatedResult,
  CharacterInGroupDTO,
} from "./types";

/**
 * Select multiple character groups by their IDs within a transaction.
 */
export async function selectCharacterGroupsByIds(
  tx: Transaction,
  ids: number[]
): Promise<CharacterGroupDTO[]> {
  if (!ids.length) {
    return [];
  }

  const items: CharacterGroupDTO[] = await tx
    .select({
      id: groupsTbl.id,
      key: groupsTbl.key,
      label: groupsTbl.label,
      description: groupsTbl.description,
      characterCount: count(charsTbl.id),
    })
    .from(groupsTbl)
    .leftJoin(charsTbl, eq(charsTbl.groupId, groupsTbl.id))
    .where(inArray(groupsTbl.id, ids))
    .groupBy(
      groupsTbl.id,
      groupsTbl.key,
      groupsTbl.label,
      groupsTbl.description
    )
    .orderBy(asc(groupsTbl.key), asc(groupsTbl.id));

  return items;
}

/**
 * List character groups with optional search and ids, paginated.
 */
export async function listCharacterGroupsQuery(args: {
  q?: string;
  ids?: number[];
  page: number;
  pageSize: number;
}): Promise<CharacterGroupPaginatedResult> {
  const { q, ids, page, pageSize } = args;
  const offset = (page - 1) * pageSize;

  const rawQ = q?.trim();
  const likeAnywhere =
    rawQ && rawQ.length ? `%${rawQ.replace(/([%_\\])/g, "\\$1")}%` : undefined;

  const filters: (SQL | undefined)[] = [
    ids && ids.length ? inArray(groupsTbl.id, ids) : undefined,
    likeAnywhere
      ? or(
          ilike(groupsTbl.label, likeAnywhere),
          ilike(groupsTbl.key, likeAnywhere)
        )
      : undefined,
  ];
  const where = and(...(filters.filter(Boolean) as SQL[]));

  const items: CharacterGroupDTO[] = await db
    .select({
      id: groupsTbl.id,
      key: groupsTbl.key,
      label: groupsTbl.label,
      description: groupsTbl.description,
      characterCount: count(charsTbl.id),
    })
    .from(groupsTbl)
    .leftJoin(charsTbl, eq(charsTbl.groupId, groupsTbl.id))
    .where(where)
    .groupBy(
      groupsTbl.id,
      groupsTbl.key,
      groupsTbl.label,
      groupsTbl.description
    )
    .orderBy(asc(groupsTbl.key), asc(groupsTbl.id))
    .limit(pageSize)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(groupsTbl)
    .where(where);

  return { items, page, pageSize, total };
}

/**
 * Fetch a single character group detail by id.
 */
export async function fetchCharacterGroupDetailById(
  id: number
): Promise<CharacterGroupDetailDTO | null> {
  // Group itself
  const [groupRow] = await db
    .select({
      id: groupsTbl.id,
      key: groupsTbl.key,
      label: groupsTbl.label,
      description: groupsTbl.description,
    })
    .from(groupsTbl)
    .where(eq(groupsTbl.id, id))
    .limit(1);

  if (!groupRow) return null;

  // Characters belonging to group
  const rows = await db
    .select({
      id: charsTbl.id,
      key: charsTbl.key,
      label: charsTbl.label,
      description: charsTbl.description,

      traitSetId: catMetaTbl.traitSetId,
      unitFamilyId: numMetaTbl.unitFamilyId,

      // Either categorical if in table, else type specified by numeric meta kind
      type: sql<"categorical" | "number" | "range">`CASE
        WHEN ${catMetaTbl.characterId} IS NOT NULL THEN 'categorical'
        WHEN ${numMetaTbl.kind} = 'single' THEN 'number'
        ELSE 'range'
      END`,
    })
    .from(charsTbl)
    .leftJoin(catMetaTbl, eq(catMetaTbl.characterId, charsTbl.id))
    .leftJoin(numMetaTbl, eq(numMetaTbl.characterId, charsTbl.id))
    .where(
      and(
        eq(charsTbl.groupId, id),
        // Only return characters that have some meta (all should, but defensive)
        or(
          sql`${catMetaTbl.characterId} IS NOT NULL`,
          sql`${numMetaTbl.characterId} IS NOT NULL`
        )
      )
    )
    .orderBy(asc(charsTbl.key), asc(charsTbl.id));

  const characters: CharacterInGroupDTO[] = rows.map((row) => {
    const base = {
      id: row.id,
      key: row.key,
      label: row.label,
      description: row.description,
    };

    if (row.type === "categorical") {
      if (row.traitSetId == null) {
        throw new Error(
          `Categorical character ${row.id} is missing traitSetId in group detail`
        );
      }
      return { ...base, type: "categorical", traitSetId: row.traitSetId };
    }

    if (row.unitFamilyId == null) {
      throw new Error(
        `Numeric character ${row.id} is missing unitFamilyId in group detail (type=${row.type})`
      );
    }

    if (row.type === "number") {
      return { ...base, type: "number", unitFamilyId: row.unitFamilyId };
    }

    return { ...base, type: "range", unitFamilyId: row.unitFamilyId };
  });

  return {
    id: groupRow.id,
    key: groupRow.key,
    label: groupRow.label,
    description: groupRow.description,
    characterCount: characters.length,
    characters,
  };
}

/**
 * Insert a character group row.
 */
export async function insertCharacterGroup(
  tx: Transaction,
  args: { key: string; label: string; description: string }
): Promise<Pick<
  CharacterGroupDTO,
  "id" | "key" | "label" | "description"
> | null> {
  const [group] = await tx
    .insert(groupsTbl)
    .values({
      key: args.key,
      label: args.label,
      description: args.description,
    })
    .returning({
      id: groupsTbl.id,
      key: groupsTbl.key,
      label: groupsTbl.label,
      description: groupsTbl.description,
    });

  return group ?? null;
}
