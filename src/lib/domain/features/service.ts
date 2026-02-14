import { db } from "../../../../db/client";
import {
  fetchFeatureDetailById,
  insertFeature,
  listFeaturesQuery,
  selectFeaturesByIds,
} from "./repo";
import type {
  FeatureDetailDTO,
  FeatureDTO,
  FeaturePaginatedResult,
} from "./types";

/**
 * Bulk fetch character groups by ID (non-paginated).
 */
export async function getFeaturesByIds(ids: number[]): Promise<FeatureDTO[]> {
  if (!ids.length) {
    return [];
  }

  const dtos = await db.transaction(async (tx) => {
    return selectFeaturesByIds(tx, ids);
  });

  return dtos;
}

/**
 * List character features with optional search/ids, paginated.
 */
export async function listFeatures(args: {
  q?: string;
  ids?: number[];
  page: number;
  pageSize: number;
}): Promise<FeaturePaginatedResult> {
  return listFeaturesQuery(args);
}

/**
 * Get a single feature detail.
 */
export async function getFeature(args: {
  id: number;
}): Promise<FeatureDetailDTO | null> {
  return fetchFeatureDetailById(args.id);
}

/**
 * Create a feature.
 */
export async function createFeature(args: {
  key: string;
  label: string;
  description?: string;
}): Promise<FeatureDTO | null> {
  const key = args.key.trim();
  const label = args.label.trim();
  const description = args.description?.trim() || "";

  return db.transaction(async (tx) => {
    const base = await insertFeature(tx, { key, label, description });
    if (!base) {
      return null;
    }

    const dto: FeatureDTO = {
      ...base,
      characterCount: 0,
    };

    return dto;
  });
}
