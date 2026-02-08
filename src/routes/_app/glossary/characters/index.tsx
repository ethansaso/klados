import { Box, Heading, Text } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import { matchCanonicalHead } from "../../../../lib/utils/head/matchCanonicalHead";

export const Route = createFileRoute("/_app/glossary/characters/")({
  head: ({ match }) => matchCanonicalHead(match),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Box>
      <Heading>Characters</Heading>
      <Text>
        Characters are the "what" of Klados' descriptions. They specify a broad
        range of data, namely text, numerical, and range values.
      </Text>
    </Box>
  );
}
