import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import {
  taxonCharacterNumber as numberTbl,
  taxonCharacterNumberRange as rangeTbl,
  taxonCharacterState as stateTbl,
} from "../../db/schema/taxa/taxonCharacterValues";
import { db } from "../../db/client";
import { eq, sql } from "drizzle-orm";

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
    // guard against stringy numbers coming through any edge path
    const taxonId = Number.isFinite(data.taxonId)
      ? Math.trunc(data.taxonId)
      : NaN;
    if (!Number.isFinite(taxonId)) {
      throw new Error("Invalid taxonId");
    }

    // Helper that tries Drizzle builder first, then falls back to a raw query
    // with an explicit ::int4 cast if your driver is picky in this environment.
    const selectIds = async (
      table: typeof stateTbl | typeof numberTbl | typeof rangeTbl
    ) => {
      try {
        return await db
          .select({ id: table.id })
          .from(table)
          .where(eq(table.taxonId, taxonId));
      } catch {
        const rows = await db.execute<{ id: number }>(sql`
          select ${table.id} as id
          from ${table}
          where ${table.taxonId} = ${sql.raw(`${taxonId}::int4`)}
        `);
        return rows.rows;
      }
    };

    const [states, numbers, ranges] = await Promise.all([
      selectIds(stateTbl),
      selectIds(numberTbl),
      selectIds(rangeTbl),
    ]);

    return [
      ...states.map((r) => ({ id: r.id, kind: "state" as const })),
      ...numbers.map((r) => ({ id: r.id, kind: "number" as const })),
      ...ranges.map((r) => ({ id: r.id, kind: "range" as const })),
    ];
  });
