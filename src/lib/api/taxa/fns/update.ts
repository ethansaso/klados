import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../../../db/client";
import {
  categoricalCharacterMeta as catMetaTbl,
  categoricalTraitValue as catValTbl,
  taxonCharacterStateCategorical as tcsCatTbl,
} from "../../../../db/schema/schema";
import { taxonName as namesTbl } from "../../../../db/schema/taxa/name";
import { taxon as taxaTbl } from "../../../../db/schema/taxa/taxon";
import { requireCuratorMiddleware } from "../../../auth/serverFnMiddleware";
import { CategoricalCharacterUpdate } from "../../../domain/character-states/validation";
import {
  common,
  commonJoinPred,
  sci,
  sciJoinPred,
  taxonSelector,
} from "../../../domain/taxa/sqlAdapters";
import { TaxonDTO } from "../../../domain/taxa/types";
import {
  assertExactlyOneAcceptedScientificName,
  getCurrentTaxonMinimal,
} from "../../../domain/taxa/utils";
import {
  CharacterUpdate,
  taxonPatchSchema,
} from "../../../domain/taxa/validation";
import { NameItem } from "../../../domain/taxon-names/validation";
import { assertHierarchyInvariant } from "../../../utils/assertHierarchyInvariant";

export const updateTaxon = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(
    z
      .object({
        id: z.number(),
      })
      .and(taxonPatchSchema)
      .superRefine((data, ctx) => {
        const { id, parentId, ...rest } = data;
        // 1) At least one field to update
        const hasAny = Object.values(rest).some((v) => v !== undefined);
        if (!hasAny) {
          ctx.addIssue({
            code: "custom",
            message: "At least one field must be provided to update.",
            path: [],
          });
        }
        // 2) parentId cannot be the same as id
        if (parentId != null && parentId === id) {
          ctx.addIssue({
            code: "custom",
            message: "A taxon's parent cannot be itself.",
            path: ["parentId"],
          });
        }
      })
  )
  .handler(async ({ data }): Promise<TaxonDTO> => {
    const { id, ...updates } = data;

    return await db.transaction(async (tx) => {
      const current = await getCurrentTaxonMinimal(tx, id);
      if (!current) {
        throw notFound();
      }
      if (current.status === "deprecated") {
        throw new Error("Deprecated taxa cannot be updated.");
      }

      const nextParentId =
        "parentId" in updates ? (updates.parentId ?? null) : current.parentId;
      const nextRank =
        "rank" in updates ? (updates.rank ?? current.rank) : current.rank;

      // Make sure new rank hierarchy isn't invalid
      if ("parentId" in updates || "rank" in updates) {
        await assertHierarchyInvariant({
          tx,
          nextParentId,
          nextRank,
        });
      }

      // Prevent self-parenting
      if (nextParentId === id) {
        throw new Error("A taxon cannot be its own parent.");
      }

      // Build update payload for the taxon row
      const updatePayload: Record<string, unknown> = {};
      if ("parentId" in updates) updatePayload.parentId = updates.parentId;
      if ("rank" in updates) updatePayload.rank = updates.rank;
      if ("sourceGbifId" in updates)
        updatePayload.sourceGbifId = updates.sourceGbifId;
      if ("sourceInatId" in updates)
        updatePayload.sourceInatId = updates.sourceInatId;
      if ("media" in updates) updatePayload.media = updates.media;
      if ("notes" in updates) updatePayload.notes = updates.notes;

      // Only issue UPDATE if there are scalar fields to change.
      if (Object.keys(updatePayload).length > 0) {
        const updated = await tx
          .update(taxaTbl)
          .set(updatePayload)
          .where(eq(taxaTbl.id, id))
          .returning({ id: taxaTbl.id });

        if (updated.length === 0) throw notFound();
      }

      // Handle names replacement (scientific + commons)
      if ("names" in updates && updates.names) {
        const incomingNames = updates.names as NameItem[];

        // Invariant 1: exactly one preferred scientific name (locale = 'sci')
        const sciPreferredCount = incomingNames.filter(
          (n) => n.locale === "sci" && n.isPreferred
        ).length;
        if (sciPreferredCount !== 1) {
          throw new Error(
            "Exactly one preferred scientific name (locale 'sci') is required when updating names."
          );
        }

        // Invariant 2: at most one preferred common per non-'sci' locale
        const preferredPerLocale = new Map<string, number>();
        for (const n of incomingNames) {
          if (n.locale === "sci" || !n.isPreferred) continue;
          const prev = preferredPerLocale.get(n.locale) ?? 0;
          if (prev >= 1) {
            throw new Error(
              `At most one preferred common name is allowed per locale; duplicate for locale "${n.locale}".`
            );
          }
          preferredPerLocale.set(n.locale, prev + 1);
        }

        // Simple semantics: replace all names for this taxon with the provided set.
        await tx.delete(namesTbl).where(eq(namesTbl.taxonId, id));

        if (incomingNames.length > 0) {
          await tx.insert(namesTbl).values(
            incomingNames.map((n) => ({
              taxonId: id,
              value: n.value.trim(),
              locale: n.locale,
              isPreferred: n.isPreferred,
            }))
          );
        }

        // Double-check only one accepted scientific name exists now
        await assertExactlyOneAcceptedScientificName(tx, id);
      }

      // Handle categorical character states (full overwrite when present)
      if ("characters" in updates) {
        const characters = (updates.characters ?? []) as CharacterUpdate[];

        // TODO: Rejects non-categorical updates for now
        const categoricalUpdates = characters.filter(
          (c): c is CategoricalCharacterUpdate => c.kind === "categorical"
        );
        if (categoricalUpdates.length !== characters.length) {
          throw new Error(
            "Only categorical characters are supported at this time."
          );
        }

        // If nothing to insert, delete existing state
        if (categoricalUpdates.length === 0) {
          await tx.delete(tcsCatTbl).where(eq(tcsCatTbl.taxonId, id));
        } else {
          // Basic normalization: dedupe by characterId, dedupe traitValueIds
          const byCharacter = new Map<number, CategoricalCharacterUpdate>();

          for (const entry of categoricalUpdates) {
            const existing = byCharacter.get(entry.characterId);
            const nextIds = new Set([
              ...(existing?.traitValueIds ?? []),
              ...entry.traitValueIds,
            ]);
            byCharacter.set(entry.characterId, {
              ...entry,
              traitValueIds: Array.from(nextIds),
            });
          }

          const normalized = Array.from(byCharacter.values());

          // Load meta rows for all involved characters
          const characterIds = normalized.map((c) => c.characterId);
          const metas = await tx
            .select({
              characterId: catMetaTbl.characterId,
              traitSetId: catMetaTbl.traitSetId,
              isMultiSelect: catMetaTbl.isMultiSelect,
            })
            .from(catMetaTbl)
            .where(inArray(catMetaTbl.characterId, characterIds));

          const metaByCharacter = new Map(metas.map((m) => [m.characterId, m]));

          // Ensure every character has categorical meta
          for (const c of normalized) {
            if (!metaByCharacter.has(c.characterId)) {
              throw new Error(
                `Character ${c.characterId} is not a categorical character or does not exist.`
              );
            }
          }

          // Load all referenced trait values
          const allTraitValueIds = Array.from(
            new Set(normalized.flatMap((c) => c.traitValueIds))
          );

          if (allTraitValueIds.length === 0) {
            // Clear everything if no IDs survive normalization
            await tx.delete(tcsCatTbl).where(eq(tcsCatTbl.taxonId, id));
          } else {
            const traitValues = await tx
              .select({
                id: catValTbl.id,
                setId: catValTbl.setId,
                isCanonical: catValTbl.isCanonical,
                canonicalValueId: catValTbl.canonicalValueId,
              })
              .from(catValTbl)
              .where(inArray(catValTbl.id, allTraitValueIds));

            const traitValueById = new Map(traitValues.map((v) => [v.id, v]));

            // 4) Validate and (optionally) canonicalize per character
            const rowsToInsert: {
              taxonId: number;
              characterId: number;
              traitValueId: number;
            }[] = [];

            for (const c of normalized) {
              const meta = metaByCharacter.get(c.characterId)!;

              if (!meta.isMultiSelect && c.traitValueIds.length > 1) {
                throw new Error(
                  `Character ${c.characterId} does not allow multiple states.`
                );
              }

              for (const rawTraitId of c.traitValueIds) {
                const tv = traitValueById.get(rawTraitId);
                if (!tv) {
                  throw new Error(
                    `Unknown trait value id ${rawTraitId} for character ${c.characterId}.`
                  );
                }

                if (tv.setId !== meta.traitSetId) {
                  throw new Error(
                    `Trait value ${rawTraitId} does not belong to the trait set for character ${c.characterId}.`
                  );
                }

                rowsToInsert.push({
                  taxonId: id,
                  characterId: c.characterId,
                  traitValueId: tv.id,
                });
              }
            }

            // 5) Replace existing rows in a single transaction
            await tx.delete(tcsCatTbl).where(eq(tcsCatTbl.taxonId, id));

            if (rowsToInsert.length > 0) {
              await tx.insert(tcsCatTbl).values(rowsToInsert);
            }
          }
        }
      }

      const [dto] = await tx
        .select(taxonSelector)
        .from(taxaTbl)
        .innerJoin(sci, sciJoinPred)
        .leftJoin(common, commonJoinPred)
        .where(eq(taxaTbl.id, id))
        .limit(1);

      if (!dto) throw notFound();
      return dto;
    });
  });
