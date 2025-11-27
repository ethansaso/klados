import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { and, asc, count, eq, ilike, inArray, or, SQL, sql } from "drizzle-orm";
import z from "zod";
import { db } from "../../../db/client";
import {
  categoricalCharacterMeta as catMetaTbl,
  character as charsTbl,
  characterGroup as groupsTbl,
  categoricalTraitSet as traitSetTbl,
  taxonCharacterStateCategorical as valCatTbl,
} from "../../../db/schema/schema";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { snakeCase } from "../../utils/casing";
import { PaginationSchema } from "../../validation/pagination";
import type {
  CategoricalCharacterDTO,
  CharacterDetailDTO,
  CharacterDTO,
  CharacterPaginatedResult,
} from "./types";
import { createCharacterSchema } from "./validation";

/**
 * TODO: List characters (categorical only for now), with pagination and optional q/ids.
 */
export const listCharacters = createServerFn({ method: "GET" })
  .inputValidator(
    PaginationSchema.extend({
      q: z.string().optional(),
      ids: z.array(z.number()).optional(),
    })
  )
  .handler(async ({ data }): Promise<CharacterPaginatedResult> => {
    const { q, ids, page, pageSize: pageSize } = data;
    const offset = (page - 1) * pageSize;

    const rawQ = q?.trim();
    const likeAnywhere =
      rawQ && rawQ.length
        ? `%${rawQ.replace(/([%_\\])/g, "\\$1")}%`
        : undefined;

    const filters: (SQL | undefined)[] = [
      ids && ids.length ? inArray(charsTbl.id, ids) : undefined,
      likeAnywhere
        ? or(
            ilike(charsTbl.label, likeAnywhere),
            ilike(charsTbl.key, likeAnywhere)
          )
        : undefined,
    ];
    const where = and(...(filters.filter(Boolean) as SQL[]));

    // Items: restrict to categorical by inner-joining cat meta.
    const items: CategoricalCharacterDTO[] = await db
      .select({
        id: charsTbl.id,
        key: charsTbl.key,
        label: charsTbl.label,
        description: charsTbl.description,
        groupId: charsTbl.groupId,
        group: {
          id: groupsTbl.id,
          label: groupsTbl.label,
        },
        usageCount: sql<number>`COUNT(${valCatTbl.id})`,
        // categorical meta
        type: sql<"categorical">`'categorical'`,
        characterId: charsTbl.id,
        traitSetId: catMetaTbl.traitSetId,
      })
      .from(charsTbl)
      .innerJoin(catMetaTbl, eq(catMetaTbl.characterId, charsTbl.id))
      .innerJoin(groupsTbl, eq(groupsTbl.id, charsTbl.groupId))
      .leftJoin(valCatTbl, eq(valCatTbl.characterId, charsTbl.id))
      .where(where)
      .groupBy(
        charsTbl.id,
        charsTbl.key,
        charsTbl.label,
        charsTbl.description,
        charsTbl.groupId,
        groupsTbl.id,
        groupsTbl.label,
        catMetaTbl.traitSetId
      )
      .orderBy(asc(groupsTbl.label), asc(charsTbl.label), asc(charsTbl.id))
      .limit(pageSize)
      .offset(offset);

    // Total (same predicate; categorical only)
    const [{ total }] = await db
      .select({ total: count() })
      .from(charsTbl)
      .innerJoin(catMetaTbl, eq(catMetaTbl.characterId, charsTbl.id))
      .where(where);

    return {
      items,
      page,
      pageSize,
      total,
    };
  });

/** TODO: Extend beyond categorical */
export const getCharacter = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      id: z.coerce.number().int().positive(),
    })
  )
  .handler(async ({ data }): Promise<CharacterDetailDTO> => {
    const { id } = data;

    // For now, only categorical characters are supported.
    const charRow = await db
      .select({
        id: charsTbl.id,
        key: charsTbl.key,
        label: charsTbl.label,
        description: charsTbl.description,
        group: {
          id: groupsTbl.id,
          label: groupsTbl.label,
        },
        usageCount: sql<number>`COUNT(${valCatTbl.id})`,

        // categorical meta
        type: sql<"categorical">`'categorical'`,
        characterId: charsTbl.id,
        isMultiSelect: catMetaTbl.isMultiSelect,

        traitSet: {
          id: traitSetTbl.id,
          key: traitSetTbl.key,
          label: traitSetTbl.label,
          description: traitSetTbl.description,
        },
      })
      .from(charsTbl)
      .innerJoin(catMetaTbl, eq(catMetaTbl.characterId, charsTbl.id))
      .innerJoin(groupsTbl, eq(groupsTbl.id, charsTbl.groupId))
      .innerJoin(traitSetTbl, eq(traitSetTbl.id, catMetaTbl.traitSetId))
      .leftJoin(valCatTbl, eq(valCatTbl.characterId, charsTbl.id))
      .where(eq(charsTbl.id, id))
      .groupBy(
        charsTbl.id,
        charsTbl.key,
        charsTbl.label,
        charsTbl.description,
        groupsTbl.id,
        groupsTbl.label,
        catMetaTbl.traitSetId,
        traitSetTbl.id,
        traitSetTbl.key,
        traitSetTbl.label,
        traitSetTbl.description,
        catMetaTbl.isMultiSelect
      )
      .limit(1)
      .then((rows) => rows[0]);

    if (!charRow) throw notFound();

    return charRow;
  });

/** TODO: Extend beyond categorical */
export const createCharacter = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(createCharacterSchema)
  .handler(async ({ data }): Promise<CharacterDTO> => {
    const key = snakeCase(data.key.trim());
    const label = data.label.trim();
    const description = data.description?.trim() || "";
    const {
      group_id: groupId,
      trait_set_id: traitSetId,
      is_multi_select: isMultiSelect,
    } = data;

    return await db.transaction(async (tx) => {
      // Insert character
      const [charRow] = await tx
        .insert(charsTbl)
        .values({ key, label, description, groupId })
        .returning({
          id: charsTbl.id,
          key: charsTbl.key,
          label: charsTbl.label,
          description: charsTbl.description,
          groupId: charsTbl.groupId,
        });

      if (!charRow) throw notFound();

      // Insert categorical meta
      await tx.insert(catMetaTbl).values({
        characterId: charRow.id,
        traitSetId,
        isMultiSelect,
      });

      // Fetch group label for DTO
      const [groupRow] = await tx
        .select({ id: groupsTbl.id, label: groupsTbl.label })
        .from(groupsTbl)
        .where(eq(groupsTbl.id, charRow.groupId))
        .limit(1);

      if (!groupRow) throw notFound();

      const dto: CategoricalCharacterDTO = {
        id: charRow.id,
        key: charRow.key,
        label: charRow.label,
        description: charRow.description,
        group: { id: groupRow.id, label: groupRow.label },
        usageCount: 0,
        type: "categorical",
        characterId: charRow.id,
        traitSetId,
      };

      return dto;
    });
  });

export const deleteCharacter = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }): Promise<{ id: number }> => {
    const { id } = data;

    return await db.transaction(async (tx) => {
      // Check whether any taxa are using this character.
      // TODO: extend for numeric/range kinds when supported.
      const [{ count: categoricalCount }] = await tx
        .select({ count: count() })
        .from(valCatTbl)
        .where(eq(valCatTbl.characterId, id));

      const usageCount = Number(categoricalCount ?? 0);

      if (usageCount > 0) {
        setResponseStatus(400);
        throw new Error(
          `Cannot delete character; it is in use by ${usageCount} taxa.`
        );
      }

      const [deleted] = await tx
        .delete(charsTbl)
        .where(eq(charsTbl.id, id))
        .returning({ id: charsTbl.id });

      if (!deleted) {
        // Character did not exist.
        throw notFound();
      }

      return deleted;
    });
  });
