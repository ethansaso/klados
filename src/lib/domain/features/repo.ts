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
  media as mediaTbl,
  numericCharacterMeta as numMetaTbl,
  taxonFeatureState as tfsTbl,
} from "../../../../db/schema/schema";
import { likeAnywhere } from "../../utils/likeAnywhere";
import { type Transaction } from "../../utils/transactionType";
import type { MediaDTO } from "../media/types";
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

  const rawItems = await tx
    .select({
      id: featuresTbl.id,
      label: featuresTbl.label,
      description: featuresTbl.description,
      parentId: featuresTbl.parentId,
      characterCount: count(characterFeatureTbl.characterId),
      mediaId: featuresTbl.mediaId,
    })
    .from(featuresTbl)
    .leftJoin(
      characterFeatureTbl,
      eq(characterFeatureTbl.featureId, featuresTbl.id),
    )
    .where(inArray(featuresTbl.id, ids))
    .groupBy(featuresTbl.id, featuresTbl.label, featuresTbl.description)
    .orderBy(asc(featuresTbl.label), asc(featuresTbl.id));

  const mediaIds = rawItems
    .map((r) => r.mediaId)
    .filter((id): id is number => id != null);
  const mediaByIds = new Map<number, MediaDTO>();
  if (mediaIds.length) {
    const mediaRows = await tx
      .select()
      .from(mediaTbl)
      .where(inArray(mediaTbl.id, mediaIds));
    for (const m of mediaRows) mediaByIds.set(m.id, m);
  }

  return rawItems.map(({ mediaId, ...r }) => ({
    ...r,
    media: mediaId != null ? (mediaByIds.get(mediaId) ?? null) : null,
  }));
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
    like ? or(ilike(featuresTbl.label, like)) : undefined,
  ];
  const filtered = filters.filter(Boolean) as SQL[];
  const where = filtered.length ? and(...filtered) : undefined;

  const rawItems = await db
    .select({
      id: featuresTbl.id,
      label: featuresTbl.label,
      description: featuresTbl.description,
      parentId: featuresTbl.parentId,
      characterCount: count(characterFeatureTbl.characterId),
      mediaId: featuresTbl.mediaId,
    })
    .from(featuresTbl)
    .leftJoin(
      characterFeatureTbl,
      eq(characterFeatureTbl.featureId, featuresTbl.id),
    )
    .where(where)
    .groupBy(featuresTbl.id, featuresTbl.label, featuresTbl.description)
    .orderBy(asc(featuresTbl.label), asc(featuresTbl.id))
    .limit(pageSize)
    .offset(offset);

  const mediaIds = rawItems
    .map((r) => r.mediaId)
    .filter((id): id is number => id != null);
  const mediaByIds = new Map<number, MediaDTO>();
  if (mediaIds.length) {
    const mediaRows = await db
      .select()
      .from(mediaTbl)
      .where(inArray(mediaTbl.id, mediaIds));
    for (const m of mediaRows) mediaByIds.set(m.id, m);
  }

  const items: FeatureDTO[] = rawItems.map(({ mediaId, ...r }) => ({
    ...r,
    media: mediaId != null ? (mediaByIds.get(mediaId) ?? null) : null,
  }));

  const totals = await db
    .select({ total: count() })
    .from(featuresTbl)
    .where(where);
  const total = totals[0]?.total ?? 0;

  return { items, page, pageSize, total };
}

/**
 * Fetch a single feature detail by id.
 */
export async function fetchFeatureDetailById(
  tx: Transaction,
  id: number,
): Promise<FeatureDetailDTO | null> {
  const parentTbl = alias(featuresTbl, "parent");

  // Feature + parent in one query
  const [featureRow] = await tx
    .select({
      id: featuresTbl.id,
      label: featuresTbl.label,
      description: featuresTbl.description,
      parentId: parentTbl.id,
      parentLabel: parentTbl.label,
      mediaId: featuresTbl.mediaId,
    })
    .from(featuresTbl)
    .leftJoin(parentTbl, eq(featuresTbl.parentId, parentTbl.id))
    .where(eq(featuresTbl.id, id))
    .limit(1);

  if (!featureRow) return null;

  const media: MediaDTO | null =
    featureRow.mediaId != null
      ? await tx
          .select()
          .from(mediaTbl)
          .where(eq(mediaTbl.id, featureRow.mediaId))
          .then((rows) => rows[0] ?? null)
      : null;

  // Sub-features (indexed on parent_id)
  const subRows = await tx
    .select({
      id: featuresTbl.id,
      label: featuresTbl.label,
    })
    .from(featuresTbl)
    .where(eq(featuresTbl.parentId, id))
    .orderBy(asc(featuresTbl.label), asc(featuresTbl.id));

  // Characters belonging to feature
  const rows = await db
    .select({
      id: charsTbl.id,
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
    .orderBy(asc(charsTbl.label), asc(charsTbl.id));

  const characters: CharacterInFeatureDTO[] = rows.map((row) => {
    const base = {
      id: row.id,
      label: row.label,
      description: row.description,
    };

    if (row.type === "categorical") {
      return { ...base, type: "categorical" };
    }

    if (row.unitFamilyId == null) {
      throw new Error(
        `Numeric character ${row.id} is missing unitFamilyId in feature detail (type=${row.type})`,
      );
    }

    if (row.type === "number") {
      return { ...base, type: "number", unitFamilyId: row.unitFamilyId };
    }

    return { ...base, type: "range", unitFamilyId: row.unitFamilyId };
  });

  return {
    id: featureRow.id,
    label: featureRow.label,
    description: featureRow.description,
    characterCount: characters.length,
    characters,
    media,
    parentFeature: featureRow.parentId
      ? {
          id: featureRow.parentId,
          label: featureRow.parentLabel!,
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
  args: { label: string; description: string; parentId?: number | null },
): Promise<FeatureDTO | null> {
  const [featureRow] = await tx
    .insert(featuresTbl)
    .values({
      label: args.label,
      description: args.description,
      parentId: args.parentId ?? null,
    })
    .returning({
      id: featuresTbl.id,
      label: featuresTbl.label,
      parentId: featuresTbl.parentId,
      description: featuresTbl.description,
      characterCount: sql<number>`0`,
    });

  return featureRow ? { ...featureRow, media: null } : null;
}

export async function updateFeatureRow(
  tx: Transaction,
  id: number,
  args: {
    label?: string;
    description?: string;
    parentId?: number | null;
    mediaId?: number | null;
  },
): Promise<Omit<FeatureDTO, "characterCount"> | null> {
  const [featureRow] = await tx
    .update(featuresTbl)
    .set({
      label: args.label,
      description: args.description,
      parentId: args.parentId,
      mediaId: args.mediaId,
    })
    .where(eq(featuresTbl.id, id))
    .returning({
      id: featuresTbl.id,
      label: featuresTbl.label,
      description: featuresTbl.description,
      parentId: featuresTbl.parentId,
      mediaId: featuresTbl.mediaId,
    });

  if (!featureRow) return null;

  return { ...featureRow, media: null };
}

/** Imperatively set the characters linked to a feature. */
export async function setCharacterFeatureRows(
  tx: Transaction,
  featureId: number,
  characterIds: number[],
): Promise<number[]> {
  // Normalize input (dedupe)
  const uniqueIds = Array.from(new Set(characterIds));

  // Load existing links
  const existing = await tx
    .select({
      characterId: characterFeatureTbl.characterId,
    })
    .from(characterFeatureTbl)
    .where(eq(characterFeatureTbl.featureId, featureId));

  // Determine insertions + deletions
  const existingIds = new Set(existing.map((r) => r.characterId));
  const nextIds = new Set(uniqueIds);
  const toInsert = uniqueIds.filter((id) => !existingIds.has(id));
  const toDelete = existing
    .filter((r) => !nextIds.has(r.characterId))
    .map((r) => r.characterId);

  // Apply deletions/insertions
  if (toDelete.length > 0) {
    await tx
      .delete(characterFeatureTbl)
      .where(
        and(
          eq(characterFeatureTbl.featureId, featureId),
          inArray(characterFeatureTbl.characterId, toDelete),
        ),
      );
  }
  if (toInsert.length > 0) {
    await tx.insert(characterFeatureTbl).values(
      toInsert.map((characterId) => ({
        featureId,
        characterId,
      })),
    );
  }

  return uniqueIds;
}

/**
 * Check whether a feature can be safely deleted.
 * Returns `null` if the feature doesn't exist, otherwise returns counts
 * of subfeatures and taxon feature-state references.
 */
export async function countDependentsForFeature(
  tx: Transaction,
  featureId: number,
): Promise<{
  subFeatureCount: number;
  featureStateCount: number;
} | null> {
  // Ensure feature exists
  const exists = await tx
    .select({ id: featuresTbl.id })
    .from(featuresTbl)
    .where(eq(featuresTbl.id, featureId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!exists) return null;

  // Count child features
  const [subRow] = await tx
    .select({ count: count() })
    .from(featuresTbl)
    .where(eq(featuresTbl.parentId, featureId));

  // Count taxon_feature_state references
  const [stateRow] = await tx
    .select({ count: count() })
    .from(tfsTbl)
    .where(eq(tfsTbl.featureId, featureId));

  return {
    subFeatureCount: subRow?.count ?? 0,
    featureStateCount: stateRow?.count ?? 0,
  };
}

/**
 * Given a set of seed feature IDs, returns a map of featureId -> parentId for
 * every feature in the ancestor chains (seeds + all of their ancestors).
 *
 * ! Assumes no cycles in the data.
 */
export async function getFeatureAncestorMap(
  featureIds: number[],
): Promise<Map<number, number | null>> {
  if (featureIds.length === 0) return new Map();

  type AncRow = { id: number; parentId: number | null };

  const rows = await db.execute<AncRow>(sql`
    WITH RECURSIVE ancestors AS (
      SELECT id, parent_id AS "parentId"
      FROM ${featuresTbl}
      WHERE id = ANY(ARRAY[${sql.join(
        featureIds.map((id) => sql`${id}`),
        sql`, `,
      )}]::integer[])
      UNION ALL
      SELECT f.id, f.parent_id AS "parentId"
      FROM ${featuresTbl} f
      INNER JOIN ancestors a ON f.id = a."parentId"
    )
    SELECT DISTINCT id, "parentId" FROM ancestors
  `);

  const map = new Map<number, number | null>();
  for (const row of rows.rows) {
    map.set(row.id, row.parentId);
  }
  return map;
}

/**
 * Delete a feature by id; returns the deleted id or null if nothing deleted.
 */
export async function deleteFeatureById(
  tx: Transaction,
  featureId: number,
): Promise<{ id: number } | null> {
  // Remove character_feature links first (FK is RESTRICT)
  await tx
    .delete(characterFeatureTbl)
    .where(eq(characterFeatureTbl.featureId, featureId));

  const [deleted] = await tx
    .delete(featuresTbl)
    .where(eq(featuresTbl.id, featureId))
    .returning({ id: featuresTbl.id });

  return deleted ?? null;
}

/**
 * Select all feature labels (unpaginated, canonical only).
 */
export async function selectAllFeatureLabels(
  tx: Transaction,
): Promise<Pick<FeatureDTO, "id" | "label" | "description">[]> {
  return tx
    .select({
      id: featuresTbl.id,
      label: featuresTbl.label,
      description: featuresTbl.description,
    })
    .from(featuresTbl)
    .orderBy(asc(featuresTbl.label));
}
