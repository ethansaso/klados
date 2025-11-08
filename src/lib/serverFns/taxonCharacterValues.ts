import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import z from "zod";
import { db } from "../../db/client";
import { characterValueCategorical } from "../../db/schema/schema";

type CategoricalRow = typeof characterValueCategorical.$inferSelect;

type CategoricalDTO = { kind: "categorical" } & Pick<CategoricalRow, "id">;

export type TaxonCharacterValueDTO =
  | CategoricalDTO
  | /* TODO: Future types here */ never;

export const getTaxonCharacterValues = createServerFn({ method: "GET" })
  .inputValidator(z.object({ taxonId: z.number().int().nonnegative() }))
  .handler(async ({ data }): Promise<TaxonCharacterValueDTO[]> => {
    const taxonId = data.taxonId;

    const values = await db
      .select({ id: characterValueCategorical.id })
      .from(characterValueCategorical)
      .where(eq(characterValueCategorical.taxonId, taxonId));

    return values.map(({ id }) => ({ id, kind: "categorical" as const }));
  });
