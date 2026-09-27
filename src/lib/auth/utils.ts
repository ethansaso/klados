import { type ParsedLocation, redirect } from "@tanstack/react-router";

const LOGIN_PATH = "/login";

export function roleIsAdmin(role: string | null | undefined) {
  return role === "admin";
}
export function roleHasCuratorRights(role: string | null | undefined) {
  return roleIsAdmin(role) || role === "curator";
}

/** Users may edit their own record; admins may edit anyone's. */
export function canEditUser(
  currentUser: { id: string; role?: string | null } | null | undefined,
  targetUserId: string,
): boolean {
  if (!currentUser) return false;
  return currentUser.id === targetUserId || roleIsAdmin(currentUser.role);
}

export function forceLoginRedirectFromRequest(request: Request) {
  const url = new URL(request.url);
  throw redirect({
    to: LOGIN_PATH,
    search: { redirect: url.pathname + url.search },
  });
}

export function generateLoginRedirectFromLocation(location: ParsedLocation) {
  return redirect({
    to: LOGIN_PATH,
    search: {
      redirect: location.href,
    },
  });
}
