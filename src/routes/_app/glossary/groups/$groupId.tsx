import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/glossary/groups/$groupId")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_app/glossary/groups/$groupId"!</div>;
}
