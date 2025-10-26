import { redirect } from "@tanstack/react-router";

const LOGIN_PATH = "/login";
export function roleIsAdmin(role: string | null | undefined) {
  return role === "admin";
}
export function roleHasCuratorRights(role: string | null | undefined) {
  return roleIsAdmin(role) || role === "curator";
}

export function forceLoginRedirect(request: Request) {
  const url = new URL(request.url);
  throw redirect({
    to: LOGIN_PATH,
    search: { redirect: url.pathname + url.search },
  });
}
