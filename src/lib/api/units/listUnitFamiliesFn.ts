import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { listUnitFamilies } from "../../domain/units/service";
import { UnitFamilyDTO } from "../../domain/units/types";

export const listUnitFamiliesFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ q: z.string().optional() }))
  .handler(async ({ data }): Promise<UnitFamilyDTO[]> => {
    const { q } = data;

    return listUnitFamilies({ q });
  });
