import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/characters/options/$setId/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_app/characters/options/$setId/"!</div>;
}
