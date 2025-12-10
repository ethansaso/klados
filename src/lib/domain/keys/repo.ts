import { and, asc, count, eq, ilike, inArray, or, SQL } from "drizzle-orm";
import { db } from "../../../db/client";
import {
  dichotomousKey as keyTbl,
  taxonName as nameTbl,
  taxon as taxonTbl,
  user as userTbl,
} from "../../../db/schema/schema";
import { userDtoSelection } from "../users/sqlAdapters";
import { KeyDTO, KeyPaginatedResult } from "./types";

export async function listKeysQuery(args: {
  q?: string;
  ids?: number[];
  page: number;
  pageSize: number;
}): Promise<KeyPaginatedResult> {
  const { q, ids, page, pageSize } = args;
  const offset = (page - 1) * pageSize;

  // Escape %, _ and \ in the search string (no user wildcards)
  const rawQ = q?.trim();
  const likeAnywhere =
    rawQ && rawQ.length ? `%${rawQ.replace(/([%_\\])/g, "\\$1")}%` : undefined;

  const filters: (SQL | undefined)[] = [
    ids && ids.length ? inArray(keyTbl.id, ids) : undefined,
    likeAnywhere
      ? or(
          ilike(keyTbl.name, likeAnywhere),
          ilike(nameTbl.value, likeAnywhere) // accepted scientific name
        )
      : undefined,
  ];

  const where = and(...(filters.filter(Boolean) as SQL[]));

  // Keys with joins to author and root taxon + accepted name
  const items: KeyDTO[] = await db
    .select({
      id: keyTbl.id,
      author: userDtoSelection,
      rootTaxon: {
        id: taxonTbl.id,
        acceptedName: nameTbl.value,
      },
      name: keyTbl.name,
      description: keyTbl.description,
      status: keyTbl.status,
      createdAt: keyTbl.createdAt,
      updatedAt: keyTbl.updatedAt,
    })
    .from(keyTbl)
    .innerJoin(userTbl, eq(userTbl.id, keyTbl.authorId))
    .innerJoin(taxonTbl, eq(taxonTbl.id, keyTbl.rootTaxonId))
    .innerJoin(
      nameTbl,
      and(
        eq(nameTbl.taxonId, taxonTbl.id),
        eq(nameTbl.locale, "sci"),
        eq(nameTbl.isPreferred, true)
      )
    )
    .where(where)
    .orderBy(asc(nameTbl.value), asc(keyTbl.name), asc(keyTbl.id))
    .limit(pageSize)
    .offset(offset);

  // Total (same predicate & joins for filtering)
  const [{ total }] = await db
    .select({ total: count() })
    .from(keyTbl)
    .innerJoin(userTbl, eq(userTbl.id, keyTbl.authorId))
    .innerJoin(taxonTbl, eq(taxonTbl.id, keyTbl.rootTaxonId))
    .innerJoin(
      nameTbl,
      and(
        eq(nameTbl.taxonId, taxonTbl.id),
        eq(nameTbl.locale, "sci"),
        eq(nameTbl.isPreferred, true)
      )
    )
    .where(where);

  return {
    items,
    page,
    pageSize,
    total,
  };
}
