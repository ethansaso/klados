import { createServerFn } from "@tanstack/react-start";
import { and, asc, count, eq, ilike, inArray, or, SQL } from "drizzle-orm";
import z from "zod";
import { db } from "../../../db/client";
import {
  character as charsTbl,
  characterGroup as groupsTbl,
} from "../../../db/schema/schema";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { PaginationSchema } from "../../validation/pagination";
import type { CharacterGroupDTO, CharacterGroupPaginatedResult } from "./types";
import { createCharacterGroupSchema } from "./validation";

export const listCharacterGroups = createServerFn({ method: "GET" })
  .inputValidator(
    PaginationSchema.extend({
      q: z.string().optional(),
      ids: z.array(z.number()).optional(),
    })
  )
  .handler(async ({ data }): Promise<CharacterGroupPaginatedResult> => {
    const { q, ids, page, pageSize: pageSize } = data;
    const offset = (page - 1) * pageSize;

    const rawQ = q?.trim();
    const likeAnywhere =
      rawQ && rawQ.length
        ? `%${rawQ.replace(/([%_\\])/g, "\\$1")}%`
        : undefined;

    const filters: (SQL | undefined)[] = [
      ids && ids.length ? inArray(groupsTbl.id, ids) : undefined,
      likeAnywhere
        ? or(
            ilike(groupsTbl.label, likeAnywhere),
            ilike(groupsTbl.key, likeAnywhere)
          )
        : undefined,
    ];
    const where = and(...(filters.filter(Boolean) as SQL[]));

    const items = await db
      .select({
        id: groupsTbl.id,
        key: groupsTbl.key,
        label: groupsTbl.label,
        description: groupsTbl.description,
        characterCount: count(charsTbl.id),
      })
      .from(groupsTbl)
      .leftJoin(charsTbl, eq(charsTbl.groupId, groupsTbl.id))
      .where(where)
      .groupBy(
        groupsTbl.id,
        groupsTbl.key,
        groupsTbl.label,
        groupsTbl.description
      )
      .orderBy(asc(groupsTbl.key), asc(groupsTbl.id))
      .limit(pageSize)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(groupsTbl)
      .where(where);

    return { items, page, pageSize, total };
  });

export const createCharacterGroup = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(createCharacterGroupSchema)
  .handler(async ({ data }): Promise<CharacterGroupDTO> => {
    const key = data.key.trim();
    const label = data.label.trim();
    const description = data.description?.trim() || "";

    const [group] = await db
      .insert(groupsTbl)
      .values({ key, label, description })
      .returning({
        id: groupsTbl.id,
        key: groupsTbl.key,
        label: groupsTbl.label,
        description: groupsTbl.description,
      });

    return { ...group, characterCount: 0 };
  });
