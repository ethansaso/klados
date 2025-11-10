import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import z from "zod";
import { db } from "../../db/client";
import { taxonCharacterStateCategorical } from "../../db/schema/schema";

type CategoricalRow = typeof taxonCharacterStateCategorical.$inferSelect;

type CategoricalDTO = { kind: "categorical" } & Pick<CategoricalRow, "id">;

export type TaxonCharacterValueDTO =
  | CategoricalDTO
  | /* TODO: Future types here */ never;

export const getTaxonCharacterValues = createServerFn({ method: "GET" })
  .inputValidator(z.object({ taxonId: z.number().int().nonnegative() }))
  .handler(async ({ data }): Promise<TaxonCharacterValueDTO[]> => {
    const taxonId = data.taxonId;

    const values = await db
      .select({ id: taxonCharacterStateCategorical.id })
      .from(taxonCharacterStateCategorical)
      .where(eq(taxonCharacterStateCategorical.taxonId, taxonId));

    return values.map(({ id }) => ({ id, kind: "categorical" as const }));
  });
