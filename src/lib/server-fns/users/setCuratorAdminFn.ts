import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { requireAdminMiddleware } from "../../auth/serverFnMiddleware";
import { setCuratorStatus } from "../../domain/users/service";

export const setCuratorAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdminMiddleware])
  .validator(z.object({ userId: z.string(), curator: z.boolean() }))
  .handler(async ({ data }) => {
    await setCuratorStatus(data.userId, data.curator);
  });
