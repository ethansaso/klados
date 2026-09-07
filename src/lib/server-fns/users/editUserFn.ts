import { createServerFn } from "@tanstack/react-start";
import { requireAuthenticationMiddleware } from "../../auth/serverFnMiddleware";
import { canEditUser } from "../../auth/utils";
import { editUser } from "../../domain/users/service";
import { userPatchSchema } from "../../domain/users/validation";

export const editUserFn = createServerFn({ method: "POST" })
  .middleware([requireAuthenticationMiddleware])
  .validator(userPatchSchema)
  .handler(async ({ data, context }) => {
    const { userId, name, description, avatar } = data;

    if (!canEditUser(context.user, userId)) {
      throw new Error("Unauthorized to edit this user.");
    }

    await editUser(userId, {
      name,
      description,
      avatar:
        avatar == null
          ? avatar
          : {
              body: Buffer.from(avatar.base64, "base64"),
              contentType: avatar.contentType,
            },
    });
  });
