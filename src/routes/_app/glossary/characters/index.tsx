import { Box } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import { GlossaryProse } from "../-chrome/GlossaryProse";
import { matchCanonicalHead } from "../../../../lib/utils/head/matchCanonicalHead";

export const Route = createFileRoute("/_app/glossary/characters/")({
  head: ({ match }) => matchCanonicalHead(match),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Box>
      <GlossaryProse.Header>Characters</GlossaryProse.Header>
      <GlossaryProse.Text>
        Characters are the "what" of Klados' descriptions. They specify a broad
        range of data, namely text, numerical, and range values.
      </GlossaryProse.Text>
    </Box>
  );
}
