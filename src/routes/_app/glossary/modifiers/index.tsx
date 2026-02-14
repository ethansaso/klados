import { Box } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import { GlossaryProse } from "../-chrome/GlossaryProse";
import { matchCanonicalHead } from "../../../../lib/utils/head/matchCanonicalHead";

export const Route = createFileRoute("/_app/glossary/modifiers/")({
  head: ({ match }) => matchCanonicalHead(match),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Box>
      <GlossaryProse.Header>Modifiers</GlossaryProse.Header>
      <GlossaryProse.Text>
        Modifiers are the "who", "when", "where", "why", and "how" to the "what"
        of characters.
      </GlossaryProse.Text>
    </Box>
  );
}
