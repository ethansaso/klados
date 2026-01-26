import { createFileRoute } from "@tanstack/react-router";
import { matchCanonicalHead } from "../../../../lib/utils/head/matchCanonicalHead";

export const Route = createFileRoute("/_app/glossary/characters/")({
  head: ({ match }) => matchCanonicalHead(match),
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Select a character to inspect it.</div>;
}
