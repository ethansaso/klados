import { isRedirect } from "@tanstack/react-router";
import { createMiddleware, createStart } from "@tanstack/react-start";
import { dbErrorMiddleware } from "./lib/utils/dbErrorMiddleware";

const convertRedirectErrorToExceptionMiddleware = createMiddleware({
  type: "function",
}).server(async ({ next }) => {
  const result = await next();
  if ("error" in result && isRedirect(result.error)) {
    throw result.error;
  }
  return result;
});

export const startInstance = createStart(() => ({
  functionMiddleware: [
    convertRedirectErrorToExceptionMiddleware,
    dbErrorMiddleware,
  ],
}));
