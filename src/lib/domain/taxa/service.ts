import { notFound } from "@tanstack/react-router";
import { and, count, eq } from "drizzle-orm";
import { db } from "../../../db/client";
import { taxon as taxaTbl } from "../../../db/schema/taxa/taxon";
import { assertHierarchyInvariant } from "../../utils/assertHierarchyInvariant";
import { replaceCategoricalStatesForTaxon } from "../character-states/repo";
import { CategoricalCharacterUpdate } from "../character-states/validation";
import { replaceNamesForTaxon } from "../taxon-names/repo";
import type { NameItem } from "../taxon-names/validation";
import { setSourcesForTaxon } from "../taxon-sources/repo";
import {
  deleteTaxonById,
  fetchTaxonDetailById,
  insertAcceptedSciName,
  insertDraftTaxon,
  listTaxaQuery,
  markTaxonActive,
  selectTaxonDtoById,
  selectTaxonDtosByIds,
  updateTaxonRow,
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
import { CharacterUpdate, UpdateTaxonInput } from "./validation";

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

function assertNamesPayloadInvariant(names: NameItem[]) {
  const sciPreferredCount = names.filter(
    (n) => n.locale === "sci" && n.isPreferred
  ).length;
  if (sciPreferredCount !== 1) {
    throw new Error(
      "Exactly one preferred scientific name (locale 'sci') is required."
    );
  }

  const preferredPerLocale = new Map<string, number>();
  for (const n of names) {
    if (n.locale === "sci" || !n.isPreferred) continue;
    const prev = preferredPerLocale.get(n.locale) ?? 0;
    if (prev >= 1)
      throw new Error(
        `At most one preferred common name per locale; duplicate for "${n.locale}".`
      );
    preferredPerLocale.set(n.locale, prev + 1);
  }
}

export async function updateTaxon(args: UpdateTaxonInput): Promise<TaxonDTO> {
  const { id, sources, ...updates } = args;

  return db.transaction(async (tx) => {
    const current = await getCurrentTaxonMinimal(tx, id);
    if (!current) throw notFound();
    if (current.status === "deprecated") {
      throw new Error("Deprecated taxa cannot be updated.");
    }

    const nextParentId =
      "parentId" in updates ? (updates.parentId ?? null) : current.parentId;
    const nextRank =
      "rank" in updates ? (updates.rank ?? current.rank) : current.rank;

    if ("parentId" in updates || "rank" in updates) {
      await assertHierarchyInvariant({ tx, nextParentId, nextRank });
    }

    if (nextParentId === id) {
      throw new Error("A taxon cannot be its own parent.");
    }

    // 1) taxon row scalar patch
    const patch = {
      ...("parentId" in updates ? { parentId: updates.parentId } : {}),
      ...("rank" in updates ? { rank: updates.rank } : {}),
      ...("sourceGbifId" in updates
        ? { sourceGbifId: updates.sourceGbifId }
        : {}),
      ...("sourceInatId" in updates
        ? { sourceInatId: updates.sourceInatId }
        : {}),
      ...("media" in updates ? { media: updates.media } : {}),
      ...("notes" in updates ? { notes: updates.notes } : {}),
    };

    const ok = await updateTaxonRow(tx, id, patch);
    if (!ok) throw notFound();

    // 2) names replace (if provided)
    if ("names" in updates && updates.names) {
      assertNamesPayloadInvariant(updates.names);
      await replaceNamesForTaxon(tx, id, updates.names);
      await assertExactlyOneAcceptedScientificName(tx, id);
    }

    // 3) categorical characters replace (if provided)
    if ("characters" in updates) {
      const characters = (updates.characters ?? []) as CharacterUpdate[];
      const categorical = characters.filter(
        (c): c is CategoricalCharacterUpdate => c.kind === "categorical"
      );
      if (categorical.length !== characters.length) {
        throw new Error(
          "Only categorical characters are supported at this time."
        );
      }
      await replaceCategoricalStatesForTaxon(tx, id, categorical);
    }

    // 4) taxon sources set (if provided)
    if (sources) {
      await setSourcesForTaxon(tx, id, sources);
    }

    const dto = await selectTaxonDtoById(tx, id);
    if (!dto) throw notFound();
    return dto;
  });
}
