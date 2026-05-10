import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import z from "zod";
import { requireCuratorMiddleware } from "../../auth/serverFnMiddleware";
import { deleteModifier } from "../../domain/modifiers/service";
import { InUseError } from "../../utils/InUseError";

export const deleteModifierFn = createServerFn({ method: "POST" })
  .middleware([requireCuratorMiddleware])
  .inputValidator(
    z.object({
      id: z.number().int().positive(),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const deleted = await deleteModifier(data.id);

      if (!deleted) {
        throw notFound();
      }

      return deleted;
    } catch (err) {
      if (err instanceof InUseError) {
        setResponseStatus(400);
        throw err;
      }
      throw err;
    }
  });
