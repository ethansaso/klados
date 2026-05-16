import { db } from "../../../../db/client";
import {
  countDependentsForFeature,
  deleteFeatureById,
  fetchFeatureDetailById,
  insertFeature,
  listFeaturesQuery,
  selectAllFeatureLabels,
  selectFeaturesByIds,
  setCharacterFeatureRows,
  updateFeatureRow,
} from "./repo";
import type {
  FeatureDetailDTO,
  FeatureDTO,
  FeaturePaginatedResult,
} from "./types";
import type { UpdateFeatureInput } from "./validation";

/**
 * Bulk fetch features by ID (non-paginated).
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
  return db.transaction(async (tx) => {
    return fetchFeatureDetailById(tx, args.id);
  });
}

/**
 * Create a feature.
 */
export async function createFeature(args: {
  label: string;
  description?: string;
  parentId?: number | null;
}): Promise<FeatureDTO | null> {
  const label = args.label.trim();
  const description = args.description?.trim() || "";

  return db.transaction(async (tx) => {
    const base = await insertFeature(tx, {
      label,
      description,
      parentId: args.parentId,
    });
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

export async function updateFeature(
  args: UpdateFeatureInput,
): Promise<FeatureDetailDTO | null> {
  const { id, label, description, parentId, characterIds, mediaId } = args;

  return db.transaction(async (tx) => {
    const updated = await updateFeatureRow(tx, id, {
      label,
      description,
      parentId,
      mediaId,
    });
    if (!updated) {
      return null;
    }

    if (characterIds) {
      await setCharacterFeatureRows(tx, id, characterIds);
    }

    const dto = await fetchFeatureDetailById(tx, id);
    if (!dto) {
      throw new Error("Unexpected error fetching updated feature");
    }

    return dto;
  });
}

export class FeatureInUseError extends Error {
  readonly subFeatureCount: number;
  readonly featureStateCount: number;

  constructor(subFeatureCount: number, featureStateCount: number) {
    const reasons: string[] = [];
    if (subFeatureCount > 0) reasons.push(`${subFeatureCount} subfeature(s)`);
    if (featureStateCount > 0)
      reasons.push(`${featureStateCount} feature state(s)`);
    super(`Cannot delete feature; it still has ${reasons.join(" and ")}.`);
    this.name = "FeatureInUseError";
    this.subFeatureCount = subFeatureCount;
    this.featureStateCount = featureStateCount;
  }
}

/**
 * Delete a feature if it has no subfeatures and no feature-state references.
 * Returns { id } if deleted, null if the feature does not exist.
 * Throws FeatureInUseError if it has dependents.
 */
export async function deleteFeature(args: {
  id: number;
}): Promise<{ id: number } | null> {
  const { id } = args;

  return db.transaction(async (tx) => {
    const dependents = await countDependentsForFeature(tx, id);

    if (dependents === null) {
      return null;
    }

    if (dependents.subFeatureCount > 0 || dependents.featureStateCount > 0) {
      throw new FeatureInUseError(
        dependents.subFeatureCount,
        dependents.featureStateCount,
      );
    }

    const deleted = await deleteFeatureById(tx, id);
    return deleted;
  });
}

/**
 * List all feature labels (unpaginated).
 */
export async function listAllFeatureLabels(): Promise<
  Pick<FeatureDTO, "id" | "label" | "description">[]
> {
  return db.transaction(async (tx) => {
    return selectAllFeatureLabels(tx);
  });
}
