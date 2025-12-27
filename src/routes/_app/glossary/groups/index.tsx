import { Text } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/glossary/groups/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Text>Select a group to inspect it.</Text>;
}
