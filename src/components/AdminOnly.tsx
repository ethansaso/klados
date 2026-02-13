import type { PropsWithChildren } from "react";
import { useMe } from "../lib/auth/useMe";
import { roleIsAdmin } from "../lib/auth/utils";

export function AdminOnly({ children }: PropsWithChildren) {
  const { data: user } = useMe();
  if (!user || !roleIsAdmin(user.role)) return null;
  return children;
}
