import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/glossary/")({
  beforeLoad: () => {
    throw redirect({
      to: "/glossary/characters",
      search: { q: "", page: 1, pageSize: 20 },
    });
  },
  component: RouteComponent,
});

function RouteComponent() {
  return null;
}
