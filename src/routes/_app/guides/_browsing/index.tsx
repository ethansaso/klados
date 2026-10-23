import { Button, Flex, Heading, Text } from "@radix-ui/themes";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PiArrowLeft } from "react-icons/pi";
import { routeSeo } from "../../../../lib/utils/head/routeSeo";

// Guides are walled off until they're ready: viewers redirect here, and the
// creator is reachable only by its exact URL.
export const Route = createFileRoute("/_app/guides/_browsing/")({
  head: ({ match }) =>
    routeSeo({
      title: "Guides | Klados",
      description: "Flowchart-style identification guides are coming soon.",
      canonicalUrl: match.pathname,
    }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Flex
      direction="column"
      align="start"
      gap="3"
      py="9"
      maxWidth="576px"
      mx="auto"
    >
      <Heading size="6" weight="bold">
        Guides are coming soon!
      </Heading>
      <Text as="p">
        Klados' flowchart-style identification guides aren't ready yet.
      </Text>
      <Text as="p">
        Eventually, this page will host visual-first resources for
        identification, curated by experts through using a highly interactive
        editor.
      </Text>
      <Text as="p">
        However, the road there is long and winding, and we want to make sure
        the rest of the site (detailed taxon descriptions, filtering and
        comparison tools, so on & so forth) hosts strong supporting content
        before committing to this feature's development.
      </Text>
      <Text as="p">
        Testing the algorithm that assists users in generating parts of these
        guides also requires a lot of data to make sure we're not biasing
        towards certain trends or tendencies.{" "}
      </Text>
      <Text as="p" weight="bold">
        Thanks to our curators for contributing to Klados!
      </Text>
      <Button asChild variant="soft">
        <Link to="/taxa">
          <PiArrowLeft />
          Return to taxa
        </Link>
      </Button>
    </Flex>
  );
}
