import { createServerFn } from "@tanstack/react-start";
import { requireAuthenticationMiddleware } from "../../auth/serverFnMiddleware";
import { editUser } from "../../domain/users/service";
import { userPatchSchema } from "../../domain/users/validation";

export const editUserFn = createServerFn({ method: "POST" })
  .middleware([requireAuthenticationMiddleware])
  .inputValidator(userPatchSchema)
  .handler(async ({ data, context }) => {
    const { userId, name, description } = data;

    // Reject if 1) not logged in or 2) not editing own profile and not admin
    const currentUser = context.user;
    if (!currentUser) {
      throw new Error("Not authenticated.");
    }
    if (currentUser.id !== userId && currentUser.role !== "admin") {
      throw new Error("Unauthorized to edit this user.");
    }

    // Update user in DB
    await editUser(userId, {
      name,
      description,
    });
  });
