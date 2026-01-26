import { Text } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import { matchCanonicalHead } from "../../../../lib/utils/head/matchCanonicalHead";

export const Route = createFileRoute("/_app/glossary/groups/")({
  head: ({ match }) => matchCanonicalHead(match),
  component: RouteComponent,
});

function RouteComponent() {
  return <Text>Select a group to inspect it.</Text>;
}
