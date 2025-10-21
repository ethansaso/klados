import { useMatchRoute } from "@tanstack/react-router";

export function useIsActive(to: string, fuzzy: boolean = false) {
  const matchRoute = useMatchRoute();
  return !!matchRoute({ to, fuzzy });
}
