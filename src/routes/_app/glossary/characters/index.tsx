import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/glossary/characters/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello!</div>;
}
