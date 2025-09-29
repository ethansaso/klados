import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "./auth";
import { redirect } from "@tanstack/react-router";

const LOGIN_PATH = "/login";

export const userSessionMiddleware = createMiddleware().server(async ({ next }) => {
  const request = getRequest();
  const session = await auth.api.getSession({ headers: request?.headers });

  return await next({
    context: { user: session?.user ?? null },
  })
})

export const requireAuthenticationMiddleware = createMiddleware({
  type: "function",
}).server(async ({ next, context }) => {
  const request = getRequest();
  const session = await auth.api.getSession({ headers: request?.headers });
  
  if (!session) {
    const url = new URL(request.url);
    throw redirect({
      to: LOGIN_PATH,
      search: { redirect: url.pathname + url.search },
    });
  }

  // Enrich downstream server-fn context
  return next({
    context: { session },
  });
});