import { useMatchRoute } from "@tanstack/react-router";

export function useIsActive(to: string | string[], fuzzy: boolean = false) {
  const matchRoute = useMatchRoute();

  const routes = Array.isArray(to) ? to : [to];

  return routes.some(
    (route) =>
      !!matchRoute({
        to: route,
        fuzzy,
      })
  );
}
