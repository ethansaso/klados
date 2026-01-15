import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import z from "zod";
import { db } from "../../../db/client";
import { guide } from "../../../db/schema/schema";
import { hydrateKeyFromRoot } from "../../../keygen/hydration/hydrateKey";

const GetGuideInputSchema = z.object({
  id: z.number().int().nonnegative(),
});

export const getGuideFn = createServerFn({ method: "GET" })
  .inputValidator(GetGuideInputSchema)
  .handler(async ({ data }) => {
    const [row] = await db.select().from(guide).where(eq(guide.id, data.id));

    if (!row) {
      throw new Error(`Guide ${data.id} not found`);
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
