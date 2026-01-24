import { Text } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/glossary/modifiers/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Text>Select a modifier to inspect it.</Text>;
}
