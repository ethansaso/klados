import { and, count, eq } from "drizzle-orm";
import { db } from "../../../db/client";
import { taxon as taxaTbl } from "../../../db/schema/taxa/taxon";
import { assertHierarchyInvariant } from "../../utils/assertHierarchyInvariant";
import {
  deleteTaxonById,
  fetchTaxonDetailById,
  insertAcceptedSciName,
  insertDraftTaxon,
  listTaxaQuery,
  markTaxonActive,
  selectTaxonDtoById,
  selectTaxonDtosByIds,
  updateTaxonStatusAndReplacement,
} from "./repo";
import { TaxonSearchParams } from "./search";
import type {
  TaxonDetailDTO,
  TaxonDTO,
  TaxonPaginatedResult,
  TaxonRow,
} from "./types";
import {
  assertExactlyOneAcceptedScientificName,
  getChildCount,
  getCurrentTaxonMinimal,
} from "./utils";

/**
 * Create a new draft taxon with an accepted scientific name.
 */
export async function createTaxonDraft(args: {
  acceptedName: string;
  parentId: number | null;
  rank: TaxonRow["rank"];
}): Promise<TaxonDTO | null> {
  const { acceptedName, parentId, rank } = args;

  return db.transaction(async (tx) => {
    await assertHierarchyInvariant({
      tx,
      nextParentId: parentId,
      nextRank: rank,
    });

    const { id } = await insertDraftTaxon(tx, { parentId, rank });

    await insertAcceptedSciName(tx, {
      taxonId: id,
      value: acceptedName,
    });

    await assertExactlyOneAcceptedScientificName(tx, id);

    const dto = await selectTaxonDtoById(tx, id);
    return dto;
  });
}

/**
 * Delete a draft taxon with no children.
 * Returns { id } if deleted, or null if the taxon does not exist.
 */
export async function deleteTaxon(args: {
  id: number;
}): Promise<{ id: number } | null> {
  const { id } = args;

  return db.transaction(async (tx) => {
    const current = await getCurrentTaxonMinimal(tx, id);
    if (!current) {
      return null;
    }

    if (current.status !== "draft") {
      throw new Error("Only draft taxa can be deleted.");
    }

    const childCount = await getChildCount(tx, id);
    if (childCount > 0) {
      throw new Error("Cannot delete a taxon that has children.");
    }

    const deleted = await deleteTaxonById(tx, id);
    return deleted;
  });
}

/**
 * Deprecate an active taxon, optionally pointing to a replacement.
 * Returns the updated TaxonDTO, or null if the taxon does not exist.
 */
export async function deprecateTaxon(args: {
  id: number;
  replacedById?: number | null;
}): Promise<TaxonDTO | null> {
  const { id, replacedById } = args;

  return db.transaction(async (tx) => {
    const current = await getCurrentTaxonMinimal(tx, id);
    if (!current) {
      return null;
    }

    if (current.status !== "active") {
      throw new Error("Only active taxa can be deprecated.");
    }

    // Don't allow deprecating with active children
    const [{ activeChildren }] = await tx
      .select({ activeChildren: count() })
      .from(taxaTbl)
      .where(and(eq(taxaTbl.parentId, id), eq(taxaTbl.status, "active")));

    if (Number(activeChildren) > 0) {
      throw new Error("Cannot deprecate a taxon that has active children.");
    }

    if (replacedById) {
      if (replacedById === id) {
        throw new Error("Taxon cannot replace itself.");
      }

      const replacement = await getCurrentTaxonMinimal(tx, replacedById);
      if (!replacement) {
        throw new Error("Replacement taxon not found.");
      }
      if (replacement.status !== "active") {
        throw new Error("Replacement taxon must be active.");
      }
    }

    const dto = await updateTaxonStatusAndReplacement(tx, {
      id,
      status: "deprecated",
      replacedById: replacedById ?? null,
    });

    return dto;
  });
}

/**
 * Get a single taxon with ancestors + names (detail view).
 */
export async function getTaxon(args: {
  id: number;
}): Promise<TaxonDetailDTO | null> {
  return fetchTaxonDetailById(args.id);
}

/**
 * Get multiple taxa by their IDs.
 */
export async function getTaxaByIds(ids: number[]): Promise<TaxonDTO[]> {
  const dtos = await db.transaction(async (tx) => {
    const results = await selectTaxonDtosByIds(tx, ids);
    return results;
  });

  return dtos;
}

/**
 * List taxa with optional search, status filter and IDs, paginated.
 */
export async function listTaxa(
  args: TaxonSearchParams
): Promise<TaxonPaginatedResult> {
  return listTaxaQuery(args);
}

/**
 * Publish a draft taxon, making it active.
 * Returns the updated TaxonDTO, or null if the taxon does not exist.
 */
export async function publishTaxon(args: {
  id: number;
}): Promise<TaxonDTO | null> {
  const { id } = args;

  return db.transaction(async (tx) => {
    const current = await getCurrentTaxonMinimal(tx, id);
    if (!current) {
      return null;
    }

    if (current.status !== "draft") {
      throw new Error("Only draft taxa can be published.");
    }

    // Ensure structure is valid at publish time and a scientific name exists.
    await assertHierarchyInvariant({
      tx,
      nextParentId: current.parentId ?? null,
      nextRank: current.rank,
    });

    await assertExactlyOneAcceptedScientificName(tx, id);

    const ok = await markTaxonActive(tx, id);
    if (!ok) {
      // Taxon disappeared or was concurrently modified.
      return null;
    }

    const dto = await selectTaxonDtoById(tx, id);
    return dto;
  });
}
