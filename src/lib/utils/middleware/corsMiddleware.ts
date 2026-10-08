import { createMiddleware } from "@tanstack/react-start";

export const corsMiddleware = createMiddleware().server(async ({ next }) => {
  const { response: res } = await next();

  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");

  return new Response(res.body, {
    status: res.status,
    headers,
  });
});
