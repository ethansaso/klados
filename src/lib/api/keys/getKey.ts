import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import z from "zod";
import { db } from "../../../db/client";
import { dichotomousKey } from "../../../db/schema/schema";
import { hydrateKeyFromRoot } from "../../../keygen/hydration/hydrateKey";

const GetKeyInputSchema = z.object({
  id: z.number().int().nonnegative(),
});

export const getKeyFn = createServerFn({ method: "GET" })
  .inputValidator(GetKeyInputSchema)
  .handler(async ({ data }) => {
    const [row] = await db
      .select()
      .from(dichotomousKey)
      .where(eq(dichotomousKey.id, data.id));

    if (!row) {
      throw new Error(`Key ${data.id} not found`);
    }

    const rootNode = await hydrateKeyFromRoot(row.tree);

    return {
      id: row.id,
      authorId: row.authorId,
      rootTaxonId: row.rootTaxonId,
      name: row.name,
      description: row.description,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      rootNode,
    };
  });
