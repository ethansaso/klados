import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/glossary/groups/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Select a group to inspect it.</div>;
}
