import "./about.css";

import { Box, Button, Flex, Heading, Link, Text } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link as RouterLink } from "@tanstack/react-router";
import { PiArrowRight } from "react-icons/pi";
import { ContentContainer } from "../../components/ContentContainer";
import { summaryStatsQueryOptions } from "../../lib/queries/stats";
import { routeSeo } from "../../lib/utils/head/routeSeo";

export const Route = createFileRoute("/_app/about")({
  beforeLoad: async ({ context }) => {
    await context.queryClient.ensureQueryData(summaryStatsQueryOptions());
  },
  head: ({ match }) =>
    routeSeo({
      title: "About | Klados",
      canonicalUrl: match.pathname,
    }),
  component: RouteComponent,
});

function RouteComponent() {
  const { data: stats } = useSuspenseQuery(summaryStatsQueryOptions());

  return (
    <ContentContainer align="stretch">
      <Box width="100%" maxWidth="720px" mx="auto" py={{ sm: "5" }}>
        <Flex align="center" gap="5" wrap="wrap" mb="6">
          <img
            className="about__headshot"
            src="/about/ethan-headshot.webp"
            alt="Ethan Saso"
          />
          <Box>
            <Text as="p" size="2" color="gray">
              About Klados
            </Text>
            <Heading as="h1" size={{ initial: "7", sm: "8" }}>
              Hi! I'm Ethan, and this is Klados.
            </Heading>
          </Box>
        </Flex>

        <Text as="p" size="4" mb="4">
          Klados is a free, community-driven website for learning to identify
          organisms. Built on shared glossary of morphological terms, every
          species becomes a living resource, explaining terms in place and
          powering comparison across the platform.
        </Text>
        <Text as="p" size="4" mb="4">
          Field guides, dichotomous keys, and the wisdom of experienced
          naturalists are wonderful resources. Nonetheless, they can be hard to
          come by, and often difficult to understand. Klados aims to make
          identification accessible to all audiences: it helps you learn the
          vocabulary, study and compare similar species, and work through
          visual-first identification guides.
        </Text>
        <Text as="p" size="4" mb="7">
          Klados is still very young. Right now, it describes only{" "}
          <strong>{countLabel(stats.taxaCount, "taxon", "taxa")}</strong> and
          hosts{" "}
          <strong>{countLabel(stats.guidesCount, "guide", "guides")}</strong>,
          but both numbers will grow as curators join. If you're interested in
          chatting about the future of the tool, feel free to reach out to{" "}
          <Link href="mailto:admin@klados.bio">admin@klados.bio</Link>.
        </Text>

        <figure className="about__figure">
          <img
            src="/about/castilleja.jpg"
            alt="A field of paintbrush (Castilleja exserta) in Carrizo Plain National Monument."
          />
          <Text as="p" size="1" color="gray" mt="1" asChild>
            <figcaption>
              To know what we stand to lose, we first need to learn what we
              have.
            </figcaption>
          </Text>
        </figure>

        <Box
          mt={{ initial: "6", sm: "8" }}
          pt="6"
          pb={{ initial: "4", sm: "0" }}
          className="about__closing"
        >
          <Text as="p" size={{ initial: "3", sm: "4" }} mb="4" weight="medium">
            If you'd like to help Klados grow, there are a few ways to pitch in:
          </Text>
          <Flex
            direction={{ initial: "column", xs: "row" }}
            wrap="wrap"
            gap="3"
          >
            <Button asChild size="3" radius="full">
              <RouterLink to="/curators/new">
                Become a curator
                <PiArrowRight />
              </RouterLink>
            </Button>
            <Button
              asChild
              size="3"
              radius="full"
              variant="surface"
              color="gray"
              highContrast
            >
              <RouterLink to="/donate">
                Donate
                <PiArrowRight />
              </RouterLink>
            </Button>
            <Button
              asChild
              size="3"
              radius="full"
              variant="surface"
              color="gray"
              highContrast
            >
              <a
                href="https://github.com/ethansaso/klados"
                target="_blank"
                rel="noopener noreferrer"
              >
                Contribute on GitHub
                <PiArrowRight />
              </a>
            </Button>
          </Flex>
        </Box>
      </Box>
    </ContentContainer>
  );
}

function countLabel(n: number, singular: string, plural: string) {
  return `${n.toLocaleString()} ${n === 1 ? singular : plural}`;
}
