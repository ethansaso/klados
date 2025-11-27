import { createServerFn } from "@tanstack/react-start";
import { userSessionMiddleware } from "../../auth/serverFnMiddleware";

/**
 * Server function to get the current authenticated user's information.
 */
export const getMeFn = createServerFn({ method: "GET" })
  .middleware([userSessionMiddleware])
  .handler(async ({ context }) => {
    const u = context.user;
    return u;
  });
