import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import z from "zod";
import { db } from "../../../../db/client";
import { guide } from "../../../../db/schema/schema";
import { dehydrateKeyGraph } from "../../../keygen/hydration/dehydrateKey";
import type { HydratedKeyGraphDTO } from "../../../keygen/hydration/types";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";

// TODO: This is a dummy function just for display as a demo (2/10/26). There should be an actual zod schema for the graph structure, and likely plenty of other changes/hardening on this function.
const SaveGuideInputSchema = z.object({
  id: z.number().int().positive().optional(), // If provided, update; otherwise, insert
  rootTaxonId: z.number().int().nonnegative(),
  name: z.string().min(1).max(255),
  description: z.string().default(""),
  graph: z.custom<HydratedKeyGraphDTO>((val) => {
    // Basic validation - ensure it has the expected structure
    return (
      val &&
      typeof val === "object" &&
      "rootNodeId" in val &&
      "nodes" in val &&
      "branches" in val &&
      Array.isArray(val.nodes) &&
      Array.isArray(val.branches)
    );
  }, "Invalid hydrated graph structure"),
});

export const saveGuideFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .validator(SaveGuideInputSchema)
  .handler(async ({ data, context }) => {
    // Dehydrate the graph for storage
    const dehydratedTree = dehydrateKeyGraph(data.graph);

    if (data.id) {
      // Update existing guide
      const [updated] = await db
        .update(guide)
        .set({
          name: data.name,
          description: data.description,
          tree: dehydratedTree,
        })
        .where(eq(guide.id, data.id))
        .returning();

      if (!updated) {
        throw new Error(`Guide ${data.id} not found`);
      }

      return { id: updated.id };
    }

    // Insert new guide
    const [inserted] = await db
      .insert(guide)
      .values({
        authorId: context.user.id, // From requireCuratorMiddleware
        rootTaxonId: data.rootTaxonId,
        name: data.name,
        description: data.description,
        tree: dehydratedTree,
      })
      .returning();

    if (!inserted) throw new Error("Failed to create guide");

    return { id: inserted.id };
  });
