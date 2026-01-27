import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import z from "zod";
import { db } from "../../../../db/client";
import { taxonSource as taxonSourceTbl } from "../../../../db/schema/schema";
import { requireAdminMiddleware } from "../../auth/serverFnMiddleware";

export const removeSourceUsagesAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdminMiddleware])
  .inputValidator(z.int().nonnegative())
  .handler(async ({ data }) => {
    await db.delete(taxonSourceTbl).where(eq(taxonSourceTbl.sourceId, data));
  });
