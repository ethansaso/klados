import { and, asc, count, eq, ilike, inArray, or, SQL } from "drizzle-orm";
import { db } from "../../../../db/client";
import {
  guide as guideTbl,
  taxonName as nameTbl,
  taxon as taxonTbl,
  user as userTbl,
} from "../../../../db/schema/schema";
import { likeAnywhere } from "../../utils/likeAnywhere";
import { userDtoSelection } from "../users/sqlAdapters";
import type { GuideDTO, GuidePaginatedResult } from "./types";

export async function listGuidesQuery(args: {
  q?: string;
  ids?: number[];
  page: number;
  pageSize: number;
}): Promise<GuidePaginatedResult> {
  const { q, ids, page, pageSize } = args;
  const offset = (page - 1) * pageSize;

  // Escape %, _ and \ in the search string (no user wildcards)
  const like = likeAnywhere(q);

  const filters: (SQL | undefined)[] = [
    ids && ids.length ? inArray(guideTbl.id, ids) : undefined,
    like
      ? or(
          ilike(guideTbl.name, like),
          ilike(nameTbl.value, like), // accepted scientific name
        )
      : undefined,
  ];

  const where = and(...(filters.filter(Boolean) as SQL[]));

  // Guides with joins to author and root taxon + accepted name
  const items: GuideDTO[] = await db
    .select({
      id: guideTbl.id,
      author: userDtoSelection,
      rootTaxon: {
        id: taxonTbl.id,
        acceptedName: nameTbl.value,
      },
      name: guideTbl.name,
      description: guideTbl.description,
      status: guideTbl.status,
      createdAt: guideTbl.createdAt,
      updatedAt: guideTbl.updatedAt,
    })
    .from(guideTbl)
    .innerJoin(userTbl, eq(userTbl.id, guideTbl.authorId))
    .innerJoin(taxonTbl, eq(taxonTbl.id, guideTbl.rootTaxonId))
    .innerJoin(
      nameTbl,
      and(
        eq(nameTbl.taxonId, taxonTbl.id),
        eq(nameTbl.locale, "sci"),
        eq(nameTbl.isPreferred, true),
      ),
    )
    .where(where)
    .orderBy(asc(nameTbl.value), asc(guideTbl.name), asc(guideTbl.id))
    .limit(pageSize)
    .offset(offset);

  // Total (same predicate & joins for filtering)
  const totals = await db
    .select({ total: count() })
    .from(guideTbl)
    .innerJoin(userTbl, eq(userTbl.id, guideTbl.authorId))
    .innerJoin(taxonTbl, eq(taxonTbl.id, guideTbl.rootTaxonId))
    .innerJoin(
      nameTbl,
      and(
        eq(nameTbl.taxonId, taxonTbl.id),
        eq(nameTbl.locale, "sci"),
        eq(nameTbl.isPreferred, true),
      ),
    )
    .where(where);
  const total = totals[0]?.total ?? 0;

  return {
    items,
    page,
    pageSize,
    total,
  };
}
