import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "./auth";
import { forceLoginRedirect, roleHasCuratorRights, roleIsAdmin } from "./utils";

export const userSessionMiddleware = createMiddleware({
  type: "request",
}).server(async ({ next, request }) => {
  const session = await auth.api.getSession({ headers: request?.headers });

  return await next({
    context: { user: session?.user ?? null },
  });
});

// TODO: sort out the 'request' / 'context' usage here
export const requireAuthenticationMiddleware = createMiddleware({
  type: "function",
}).server(async ({ next }) => {
  const request = getRequest();
  const session = await auth.api.getSession({ headers: request?.headers });

  if (!session) {
    forceLoginRedirect(request);
  }

  // Enrich downstream server-fn context
  return next({
    context: { session },
  });
});

export const requireCuratorMiddleware = createMiddleware({
  type: "function",
}).server(async ({ context, next }) => {
  const request = getRequest();
  const session = await auth.api.getSession({ headers: request?.headers });
  const role = session?.user.role;

  if (!session || !roleHasCuratorRights(role)) {
    forceLoginRedirect(request);
  }

  return next({
    context: { session },
  });
});

export const requireAdminMiddleware = createMiddleware({
  type: "function",
}).server(async ({ context, next }) => {
  const request = getRequest();
  const session = await auth.api.getSession({ headers: request?.headers });
  const role = session?.user.role;

  if (!session || !roleIsAdmin(role)) {
    forceLoginRedirect(request);
  }

  return next({
    context: { session },
  });
});
