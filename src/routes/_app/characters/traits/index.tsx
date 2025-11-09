import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/characters/traits/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Select a trait set to inspect it.</div>;
}
