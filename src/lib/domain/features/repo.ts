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
import { alias } from "drizzle-orm/pg-core";

import { db } from "../../../../db/client";
import {
  categoricalCharacterMeta as catMetaTbl,
  characterFeature as characterFeatureTbl,
  character as charsTbl,
  feature as featuresTbl,
  numericCharacterMeta as numMetaTbl,
} from "../../../../db/schema/schema";
import { likeAnywhere } from "../../utils/likeAnywhere";
import { type Transaction } from "../../utils/transactionType";
import type {
  CharacterInFeatureDTO,
  FeatureDetailDTO,
  FeatureDTO,
  FeaturePaginatedResult,
} from "./types";

/**
 * Select multiple features by their IDs within a transaction.
 */
export async function selectFeaturesByIds(
  tx: Transaction,
  ids: number[],
): Promise<FeatureDTO[]> {
  if (!ids.length) {
    return [];
  }

  const items: FeatureDTO[] = await tx
    .select({
      id: featuresTbl.id,
      key: featuresTbl.key,
      label: featuresTbl.label,
      description: featuresTbl.description,
      characterCount: count(characterFeatureTbl.characterId),
    })
    .from(featuresTbl)
    .leftJoin(
      characterFeatureTbl,
      eq(characterFeatureTbl.featureId, featuresTbl.id),
    )
    .where(inArray(featuresTbl.id, ids))
    .groupBy(
      featuresTbl.id,
      featuresTbl.key,
      featuresTbl.label,
      featuresTbl.description,
    )
    .orderBy(asc(featuresTbl.key), asc(featuresTbl.id));

  return items;
}

/**
 * List features with optional search and ids, paginated.
 */
export async function listFeaturesQuery(args: {
  q?: string;
  ids?: number[];
  page: number;
  pageSize: number;
}): Promise<FeaturePaginatedResult> {
  const { q, ids, page, pageSize } = args;
  const offset = (page - 1) * pageSize;

  const like = likeAnywhere(q);

  const filters: (SQL | undefined)[] = [
    ids && ids.length ? inArray(featuresTbl.id, ids) : undefined,
    like
      ? or(ilike(featuresTbl.label, like), ilike(featuresTbl.key, like))
      : undefined,
  ];
  const filtered = filters.filter(Boolean) as SQL[];
  const where = filtered.length ? and(...filtered) : undefined;

  const items: FeatureDTO[] = await db
    .select({
      id: featuresTbl.id,
      key: featuresTbl.key,
      label: featuresTbl.label,
      description: featuresTbl.description,
      characterCount: count(characterFeatureTbl.characterId),
    })
    .from(featuresTbl)
    .leftJoin(
      characterFeatureTbl,
      eq(characterFeatureTbl.featureId, featuresTbl.id),
    )
    .where(where)
    .groupBy(
      featuresTbl.id,
      featuresTbl.key,
      featuresTbl.label,
      featuresTbl.description,
    )
    .orderBy(asc(featuresTbl.key), asc(featuresTbl.id))
    .limit(pageSize)
    .offset(offset);

  const totals = await db
    .select({ total: count() })
    .from(featuresTbl)
    .where(where);
  const total = totals[0]?.total ?? 0;

  return { items, page, pageSize, total };
}

/**
 * Fetch a single character group detail by id.
 */
export async function fetchFeatureDetailById(
  id: number,
): Promise<FeatureDetailDTO | null> {
  const parentTbl = alias(featuresTbl, "parent");

  // Feature + parent in one query
  const [groupRow] = await db
    .select({
      id: featuresTbl.id,
      key: featuresTbl.key,
      label: featuresTbl.label,
      description: featuresTbl.description,
      parentId: parentTbl.id,
      parentKey: parentTbl.key,
      parentLabel: parentTbl.label,
    })
    .from(featuresTbl)
    .leftJoin(parentTbl, eq(featuresTbl.parentId, parentTbl.id))
    .where(eq(featuresTbl.id, id))
    .limit(1);

  if (!groupRow) return null;

  // Sub-features (indexed on parent_id)
  const subRows = await db
    .select({
      id: featuresTbl.id,
      key: featuresTbl.key,
      label: featuresTbl.label,
    })
    .from(featuresTbl)
    .where(eq(featuresTbl.parentId, id))
    .orderBy(asc(featuresTbl.key), asc(featuresTbl.id));

  // Characters belonging to feature
  const rows = await db
    .select({
      id: charsTbl.id,
      key: charsTbl.key,
      label: charsTbl.label,
      description: charsTbl.description,

      unitFamilyId: numMetaTbl.unitFamilyId,

      // Either categorical if in table, else type specified by numeric meta kind
      type: sql<"categorical" | "number" | "range">`CASE
        WHEN ${catMetaTbl.characterId} IS NOT NULL THEN 'categorical'
        WHEN ${numMetaTbl.kind} = 'single' THEN 'number'
        ELSE 'range'
      END`,
    })
    .from(characterFeatureTbl)
    .innerJoin(charsTbl, eq(charsTbl.id, characterFeatureTbl.characterId))
    .leftJoin(catMetaTbl, eq(catMetaTbl.characterId, charsTbl.id))
    .leftJoin(numMetaTbl, eq(numMetaTbl.characterId, charsTbl.id))
    .where(eq(characterFeatureTbl.featureId, id))
    .orderBy(asc(charsTbl.key), asc(charsTbl.id));

  const characters: CharacterInFeatureDTO[] = rows.map((row) => {
    const base = {
      id: row.id,
      key: row.key,
      label: row.label,
      description: row.description,
    };

    if (row.type === "categorical") {
      return { ...base, type: "categorical" };
    }

    if (row.unitFamilyId == null) {
      throw new Error(
        `Numeric character ${row.id} is missing unitFamilyId in group detail (type=${row.type})`,
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
    parentFeature: groupRow.parentId
      ? {
          id: groupRow.parentId,
          key: groupRow.parentKey!,
          label: groupRow.parentLabel!,
        }
      : null,
    subFeatures: subRows,
  };
}

/**
 * Insert a feature row.
 */
export async function insertFeature(
  tx: Transaction,
  args: { key: string; label: string; description: string },
): Promise<Pick<FeatureDTO, "id" | "key" | "label" | "description"> | null> {
  const [group] = await tx
    .insert(featuresTbl)
    .values({
      key: args.key,
      label: args.label,
      description: args.description,
    })
    .returning({
      id: featuresTbl.id,
      key: featuresTbl.key,
      label: featuresTbl.label,
      description: featuresTbl.description,
    });

  return group ?? null;
}
