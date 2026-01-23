import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { requireAdminMiddleware } from "../../auth/serverFnMiddleware";
import { unbanUser } from "../../domain/users/service";

export const unbanUserFn = createServerFn({ method: "GET" })
  .middleware([requireAdminMiddleware])
  .inputValidator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    const { userId } = data;
    await unbanUser(userId);
  });
