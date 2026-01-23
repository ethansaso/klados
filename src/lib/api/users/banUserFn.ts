import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { requireAdminMiddleware } from "../../auth/serverFnMiddleware";
import { banUser, getUserByIdOrUsername } from "../../domain/users/service";

export const banUserFn = createServerFn({ method: "GET" })
  .middleware([requireAdminMiddleware])
  .inputValidator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    const { userId } = data;

    // Get user from DB
    const user = await getUserByIdOrUsername(userId);

    // Check they're not an admin
    if (user?.role === "admin") {
      throw new Error("Cannot ban an admin user.");
    }

    // Ban user
    await banUser(userId);
  });
