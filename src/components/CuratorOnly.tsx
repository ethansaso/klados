import { PropsWithChildren } from "react";
import { useMe } from "../lib/auth/useMe";
import { roleHasCuratorRights } from "../lib/auth/utils";

export function CuratorOnly({ children }: PropsWithChildren) {
  const { data: user } = useMe();
  if (!user || !roleHasCuratorRights(user.role)) return null;
  return children;
}
