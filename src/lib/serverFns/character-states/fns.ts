import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import z from "zod";
import { db } from "../../../db/client";
import { taxonCharacterStateCategorical } from "../../../db/schema/schema";
import { TaxonCharacterStateDTO } from "./types";

export const getTaxonCharacterStates = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      taxonId: z.number().int().nonnegative(),
    })
  )
  .handler(async ({ data }): Promise<TaxonCharacterStateDTO[]> => {
    const { taxonId } = data;

    // One row per (taxon, character, traitValue)
    const rows = await db
      .select({
        characterId: taxonCharacterStateCategorical.characterId,
        traitValueId: taxonCharacterStateCategorical.traitValueId,
      })
      .from(taxonCharacterStateCategorical)
      .where(eq(taxonCharacterStateCategorical.taxonId, taxonId));

    if (rows.length === 0) {
      return [];
    }

    // Group by characterId
    const byCharacter = new Map<number, number[]>();

    for (const row of rows) {
      let list = byCharacter.get(row.characterId);
      if (!list) {
        list = [];
        byCharacter.set(row.characterId, list);
      }
      list.push(row.traitValueId);
    }

    const result: TaxonCharacterStateDTO[] = [];

    for (const [characterId, traitValueIds] of byCharacter.entries()) {
      result.push({
        kind: "categorical",
        characterId,
        traitValueIds,
      });
    }

    return result;
  });
