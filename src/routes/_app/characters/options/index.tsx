import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/characters/options/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Select an option set to inspect it.</div>;
}
