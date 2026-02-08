import { Box, Heading, Text } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import { matchCanonicalHead } from "../../../../lib/utils/head/matchCanonicalHead";

export const Route = createFileRoute("/_app/glossary/modifiers/")({
  head: ({ match }) => matchCanonicalHead(match),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Box>
      <Heading>Modifiers</Heading>
      <Text>
        Modifiers are the "who", "when", "where", "why", and "how" to the "what"
        of characters.
      </Text>
    </Box>
  );
}
