import { Box, Strong } from "@radix-ui/themes";
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
      <GlossaryProse.Text>
        There are five classes of modifiers:
      </GlossaryProse.Text>
      <GlossaryProse.List>
        <GlossaryProse.ListItem>
          <Strong>Positional</Strong>: The position of a character in relation
          to something else.
        </GlossaryProse.ListItem>
        <GlossaryProse.ListItem>
          <Strong>Reliability</Strong>: The frequency of a character, or how
          much we can trust that a character will be present.
        </GlossaryProse.ListItem>
        <GlossaryProse.ListItem>
          <Strong>Demographic</Strong>: The subset of individuals that a
          character applies to.
        </GlossaryProse.ListItem>
        <GlossaryProse.ListItem>
          <Strong>Reactive</Strong>: The conditions under which a character
          appears or changes.
        </GlossaryProse.ListItem>
        <GlossaryProse.ListItem>
          <Strong>Intensity</Strong>: "Fluff" modifiers that describe an often
          subjective quality of a character.
        </GlossaryProse.ListItem>
      </GlossaryProse.List>
    </Box>
  );
}
