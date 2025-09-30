import { useMatchRoute } from "@tanstack/react-router";

export function useIsActive(to: string) {
  const matchRoute = useMatchRoute();
  return !!matchRoute({ to });
}