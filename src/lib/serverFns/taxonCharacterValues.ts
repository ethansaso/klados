import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import z from "zod";
import { db } from "../../db/client";
import {
  taxonCharacterNumber as numberTbl,
  taxonCharacterNumberRange as rangeTbl,
  taxonCharacterState as stateTbl,
} from "../../db/schema/taxa/taxonCharacterValues";

type StateRow = typeof stateTbl.$inferSelect;
type NumberRow = typeof numberTbl.$inferSelect;
type RangeRow = typeof rangeTbl.$inferSelect;

type StateDTO = { kind: "state" } & Pick<StateRow, "id">;
type NumberDTO = { kind: "number" } & Pick<NumberRow, "id">;
type RangeDTO = { kind: "range" } & Pick<RangeRow, "id">;

export type TaxonCharacterValueDTO = StateDTO | NumberDTO | RangeDTO;

export const getTaxonCharacterValues = createServerFn({ method: "GET" })
  .inputValidator(z.object({ taxonId: z.number().int().nonnegative() }))
  .handler(async ({ data }): Promise<TaxonCharacterValueDTO[]> => {
    const taxonId = data.taxonId;

    const [states, numbers, ranges] = await Promise.all([
      db
        .select({ id: stateTbl.id })
        .from(stateTbl)
        .where(eq(stateTbl.taxonId, taxonId)),
      db
        .select({ id: numberTbl.id })
        .from(numberTbl)
        .where(eq(numberTbl.taxonId, taxonId)),
      db
        .select({ id: rangeTbl.id })
        .from(rangeTbl)
        .where(eq(rangeTbl.taxonId, taxonId)),
    ]);

    return [
      ...states.map(({ id }) => ({ id, kind: "state" as const })),
      ...numbers.map(({ id }) => ({ id, kind: "number" as const })),
      ...ranges.map(({ id }) => ({ id, kind: "range" as const })),
    ];
  });
