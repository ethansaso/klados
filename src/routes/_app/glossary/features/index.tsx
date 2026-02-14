import { Box } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import { GlossaryProse } from "../-chrome/GlossaryProse";
import { matchCanonicalHead } from "../../../../lib/utils/head/matchCanonicalHead";

export const Route = createFileRoute("/_app/glossary/features/")({
  head: ({ match }) => matchCanonicalHead(match),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Box>
      <GlossaryProse.Header>Features</GlossaryProse.Header>
      <GlossaryProse.Text>
        Features, simply put, are the recognizable 'things' that visually
        identify an organism. They can be thought of as the 'nouns' in the
        language of morphology.
      </GlossaryProse.Text>
      <GlossaryProse.Text>
        Klados uses a tree-like model for features, where broad features can
        have more specific sub-features. For example, "mushroom" might be the
        parent feature of "cap", "stem", and "gills", each of which could have
        their own sub-features.
      </GlossaryProse.Text>
    </Box>
  );
}
