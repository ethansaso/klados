import { notFound } from "@tanstack/react-router";
import { and, count, eq } from "drizzle-orm";
import { db } from "../../../../db/client";
import { taxonMedia as taxonMediaTbl } from "../../../../db/schema/media/taxonMedia";
import { taxon as taxaTbl } from "../../../../db/schema/taxa/taxon";
import { assertHierarchyInvariant } from "../../utils/assertHierarchyInvariant";
import { getFeatureDescendantIds } from "../features/repo";
import { replaceGroupedCharacterStatesForTaxon } from "../states/repo";
import { replaceNamesForTaxon } from "../taxon-names/repo";
import type { NameItem } from "../taxon-names/validation";
import { setSourcesForTaxon } from "../taxon-sources/repo";
import { selectSynonymSetIdsByTraitValueIds } from "../traits/repo";
import { convertToSI } from "../units/conversion";
import { listUnitFamiliesQuery } from "../units/repo";
import {
  deleteTaxonById,
  fetchTaxonDetailById,
  insertAcceptedSciName,
  insertDraftTaxon,
  listTaxaQuery,
  markTaxonActive,
  selectIndexableTaxa,
  selectTaxonDtoById,
  selectTaxonDtosByIds,
  updateTaxonRow,
  updateTaxonStatusAndReplacement,
  type ResolvedFilter,
} from "./repo";
import type { TaxonSearchParams } from "./search";
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
import type { UpdateTaxonInput } from "./validation";

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
 * Archive an active taxon, optionally pointing to a replacement.
 * Returns the updated TaxonDTO, or null if the taxon does not exist.
 */
export async function archiveTaxon(args: {
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
      throw new Error("Only active taxa can be archived.");
    }

    // Don't allow deprecating with active children
    const activeChildrenRows = await tx
      .select({ activeChildren: count() })
      .from(taxaTbl)
      .where(and(eq(taxaTbl.parentId, id), eq(taxaTbl.status, "active")));
    const activeChildren = activeChildrenRows[0]?.activeChildren ?? 0;

    if (Number(activeChildren) > 0) {
      throw new Error("Cannot archived a taxon that has active children.");
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
      status: "archived",
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
 *
 * Widens feature filters to feature + recursive sub-features so
 * e.g. "cap" still matches for the filter "sporocarp" if "sporocarp"
 * isn't explicitly present on a taxon.
 */
export async function listTaxa(
  args: TaxonSearchParams,
): Promise<TaxonPaginatedResult> {
  return listTaxaQuery(args, { filters: await resolveFilters(args.filters) });
}

/**
 * Turn URL tokens into resolved predicates. Order preserved, invalid dropped. Rules:
 * * features -> ancestry closure,
 * * categorical values -> synonym set,
 * * numeric -> SI.
 */
async function resolveFilters(
  tokens: TaxonSearchParams["filters"],
): Promise<ResolvedFilter[]> {
  if (!tokens.length) return [];

  const featureIds = tokens
    .filter((token) => token.k === "f")
    .map((token) => token.f);

  const [closureByRoot, { synonymSetByValue, scaleByUnit }] = await Promise.all(
    [
      featureIds.length
        ? getFeatureDescendantIds(featureIds)
        : new Map<number, number[]>(),
      db.transaction(async (tx) => {
        const synonymSetByValue = await selectSynonymSetIdsByTraitValueIds(
          tx,
          tokens.filter((token) => token.k === "c").map((token) => token.t),
        );

        const families = tokens.some(
          (token) => token.k === "n" && token.u !== undefined,
        )
          ? await listUnitFamiliesQuery(tx)
          : [];

        return {
          synonymSetByValue,
          scaleByUnit: new Map(
            families.flatMap((family) =>
              family.units.map((unit) => [unit.id, unit.scale] as const),
            ),
          ),
        };
      }),
    ],
  );

  return tokens.flatMap((token): ResolvedFilter[] => {
    if (token.k === "f") {
      const closure = closureByRoot.get(token.f) ?? [];
      if (closure.length === 0) return [];
      return [{ kind: "feature", featureIds: closure }];
    }

    if (token.k === "c") {
      const synonymSetId = synonymSetByValue.get(token.t);
      if (synonymSetId === undefined) return [];

      return [
        {
          kind: "categorical",
          featureId: token.f,
          characterId: token.c,
          synonymSetId,
        },
      ];
    }

    // A dimensionless value is already in base units, so there is nothing to
    // convert and no unit to resolve.
    if (token.u === undefined) {
      return [
        {
          kind: "numeric",
          featureId: token.f,
          characterId: token.c,
          siValue: token.v,
        },
      ];
    }

    const scale = scaleByUnit.get(token.u);
    if (scale === undefined) return [];

    return [
      {
        kind: "numeric",
        featureId: token.f,
        characterId: token.c,
        siValue: convertToSI(token.v, scale),
      },
    ];
  });
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
    (n) => n.locale === "sci" && n.isPreferred,
  ).length;
  if (sciPreferredCount !== 1) {
    throw new Error(
      "Exactly one preferred scientific name (locale 'sci') is required.",
    );
  }

  const preferredPerLocale = new Map<string, number>();
  for (const n of names) {
    if (n.locale === "sci" || !n.isPreferred) continue;
    const prev = preferredPerLocale.get(n.locale) ?? 0;
    if (prev >= 1)
      throw new Error(
        `At most one preferred common name per locale; duplicate for "${n.locale}".`,
      );
    preferredPerLocale.set(n.locale, prev + 1);
  }
}

export async function updateTaxon(args: UpdateTaxonInput): Promise<TaxonDTO> {
  const { id, sources, mediaIds, ...updates } = args;

  return db.transaction(async (tx) => {
    const current = await getCurrentTaxonMinimal(tx, id);
    if (!current) throw notFound();
    if (current.status === "archived") {
      throw new Error("Archived taxa cannot be updated.");
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
      ...("ecology" in updates ? { ecology: updates.ecology } : {}),
      ...("sourceGbifId" in updates
        ? { sourceGbifId: updates.sourceGbifId }
        : {}),
      ...("sourceInatId" in updates
        ? { sourceInatId: updates.sourceInatId }
        : {}),
      ...("notes" in updates ? { notes: updates.notes } : {}),
    };

    const ok = await updateTaxonRow(tx, id, patch);
    if (!ok) throw notFound();

    // 2) names replace (if provided)
    if (updates.names) {
      assertNamesPayloadInvariant(updates.names);
      await replaceNamesForTaxon(tx, id, updates.names);
      await assertExactlyOneAcceptedScientificName(tx, id);
    }

    // 3) character states replace (if provided)
    if (updates.states) {
      await replaceGroupedCharacterStatesForTaxon(tx, id, updates.states ?? []);
    }

    // 4) taxon sources set (if provided)
    if (sources) {
      await setSourcesForTaxon(tx, id, sources);
    }

    // 5) taxon_media replace (if provided)
    if (mediaIds !== undefined) {
      await tx.delete(taxonMediaTbl).where(eq(taxonMediaTbl.taxonId, id));
      if (mediaIds.length > 0) {
        await tx.insert(taxonMediaTbl).values(
          mediaIds.map((mediaId, position) => ({
            taxonId: id,
            mediaId,
            position,
          })),
        );
      }
    }

    const dto = await selectTaxonDtoById(tx, id);
    if (!dto) throw notFound();
    return dto;
  });
}

export async function getTaxaSitemapEntries(): Promise<
  {
    loc: string;
    lastmod: string;
  }[]
> {
  const taxa = await selectIndexableTaxa();

  return taxa.map((t) => ({
    loc: `https://klados.bio/taxa/${t.id}`,
    lastmod: t.updatedAt.toISOString().slice(0, 10),
  }));
}
