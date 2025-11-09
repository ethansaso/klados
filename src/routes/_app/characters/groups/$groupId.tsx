import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/characters/groups/$groupId")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_app/characters/groups/$groupId"!</div>;
}
