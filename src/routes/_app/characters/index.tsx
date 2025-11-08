import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/characters/")({
  beforeLoad: () => {
    throw redirect({
      to: "/characters/definitions",
      search: { q: "", page: 1, pageSize: 20 },
    });
  },
  component: RouteComponent,
});

function RouteComponent() {
  return null;
}
