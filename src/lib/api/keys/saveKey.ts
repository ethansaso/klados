import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import z from "zod";
import { db } from "../../../db/client";
import { dichotomousKey } from "../../../db/schema/schema";
import { dehydrateFrontendKey } from "../../../keygen/hydration/dehydrateKey";
import { FrontendTaxonNode } from "../../../keygen/hydration/types";
import { requireAuthenticationMiddleware } from "../../auth/serverFnMiddleware";

const SaveKeyInputSchema = z.object({
  id: z.number().int().optional(), // present => update
  rootTaxonId: z.number().int(),
  name: z.string().min(1),
  description: z.string().default(""),
  status: z.enum(["unapproved", "pending", "approved"]).default("unapproved"),
  rootNode: z.custom<FrontendTaxonNode>(),
});

export const saveKeyFn = createServerFn({ method: "POST" })
  .middleware([requireAuthenticationMiddleware])
  .inputValidator(SaveKeyInputSchema)
  .handler(async ({ data, context }) => {
    const user = context.user;

    if (data.rootNode.id !== data.rootTaxonId) {
      throw new Error("rootNode.id must match rootTaxonId");
    }

    const tree = dehydrateFrontendKey(data.rootNode);

    if (data.id) {
      await db
        .update(dichotomousKey)
        .set({
          rootTaxonId: data.rootTaxonId,
          name: data.name,
          description: data.description,
          status: data.status,
          tree,
          updatedAt: new Date(),
        })
        .where(eq(dichotomousKey.id, data.id));

      return { id: data.id };
    }

    const [row] = await db
      .insert(dichotomousKey)
      .values({
        authorId: user.id,
        rootTaxonId: data.rootTaxonId,
        name: data.name,
        description: data.description,
        status: data.status,
        tree,
      })
      .returning({ id: dichotomousKey.id });

    return { id: row.id };
  });
