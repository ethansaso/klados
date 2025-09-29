import { createServerFn } from "@tanstack/react-start";
import { userSessionMiddleware } from "./middleware";

export const getUser = createServerFn({ method: "GET" })
  .middleware([userSessionMiddleware])
  .handler(async ({ context }) => {
    return context.user;
  })