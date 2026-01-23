import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getUserByIdOrUsername } from "../../domain/users/service";
import { UserDTO } from "../../domain/users/types";

/**
 * Server function to get a single user by ID.
 */
export const getUserFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      id: z.string(),
    })
  )
  .handler(async ({ data }): Promise<UserDTO> => {
    const { id } = data;

    const user = await getUserByIdOrUsername(id);
    if (!user) {
      throw notFound();
    }

    return user;
  });
