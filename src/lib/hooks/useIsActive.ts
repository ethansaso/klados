import { useRouterState } from "@tanstack/react-router";

export function useIsActive(to: string) {
  const { location } = useRouterState();
  return to === "/"
    ? location.pathname === "/"
    : location.pathname.startsWith(to);
}