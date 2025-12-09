import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "./auth";
import {
  forceLoginRedirectFromRequest,
  roleHasCuratorRights,
  roleIsAdmin,
} from "./utils";

export const userSessionMiddleware = createMiddleware({
  type: "request",
}).server(async ({ next, request }) => {
  const session = await auth.api.getSession({ headers: request?.headers });

  return await next({
    context: { user: session?.user ?? null },
  });
});

export const requireAuthenticationMiddleware = createMiddleware({
  type: "function",
})
  .middleware([userSessionMiddleware])
  .server(async ({ context, next }) => {
    const request = getRequest();
    const user = context.user;

    if (!user) {
      forceLoginRedirectFromRequest(request);
    }

    return next({
      context: { user: user! },
    });
  });

export const requireCuratorMiddleware = createMiddleware({
  type: "function",
})
  .middleware([userSessionMiddleware])
  .server(async ({ context, next }) => {
    const request = getRequest();
    const role = context.user?.role;

    if (!context.user || !roleHasCuratorRights(role)) {
      forceLoginRedirectFromRequest(request);
    }

    return next();
  });

export const requireAdminMiddleware = createMiddleware({
  type: "function",
})
  .middleware([userSessionMiddleware])
  .server(async ({ context, next }) => {
    const request = getRequest();
    const role = context.user?.role;

    if (!context.user || !roleIsAdmin(role)) {
      forceLoginRedirectFromRequest(request);
    }

    return next();
  });
