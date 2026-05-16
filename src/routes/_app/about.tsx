import { Box, Em, Flex, Heading, Link, Strong, Text } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import { ContentContainer } from "../../components/ContentContainer";
import { routeSeo } from "../../lib/utils/head/routeSeo";

export const Route = createFileRoute("/_app/about")({
  head: ({ match }) =>
    routeSeo({
      title: "About | Klados",
      canonicalUrl: match.pathname,
    }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ContentContainer align="start">
      <Box mb="5">
        <Heading mb="3">What is Klados?</Heading>
        <Text as="p" mb="2">
          Klados is a free, community-driven platform for educational resources
          surrounding the identification and morphology of organisms. It uses a
          rich dataset of language, images, and relationships to provide
          resources like interactive identification guides and detailed taxon
          descriptions, all created and curated by the community.
        </Text>
        <Text as="p" size="2">
          <Em>
            Disclaimer: Klados is currently in early alpha. Generated guides
            and/or taxon descriptions may contain errors and should be reviewed
            before acceptance.
          </Em>
        </Text>
      </Box>
      <Box mb="5">
        <Heading mb="3">What *isn't* Klados?</Heading>
        <Text as="p" mb="2">
          Klados is not an observational platform like iNaturalist, nor is it a
          formal taxonomic database like ITIS or GBIF. Its primary focus is on
          providing tools for identification and learning, rather than data
          collection or taxonomic authority.
        </Text>
        <Text as="p" mb="2">
          Furthermore, Klados is not intended to replace traditional dichotomous
          keys, or other established identification resources. Instead, Klados
          provides a community-driven alternative that emphasizes collaboration,
          accessibility, and ease of use.
        </Text>
        <Text as="p">
          <Strong>
            Klados should not be used to host or digitize copyrighted materials,
            including verbatim descriptions and dichotomous keys, without
            explicit permission from the original author(s).
          </Strong>
        </Text>
      </Box>
      <Box mb="5">
        <Heading mb="3">Our Mission</Heading>
        <Text as="p">
          Klados was created with the idea of free, equitable access to learning
          resources for anyone seeking to learn to identify organisms.
          Dichotomous keys for many fields are often hard to obtain, and are
          written in a jargon-heavy, inaccessible fashion which discourages
          newcomers to the field and ultimately hinders community contribution
          to science. Klados addresses this with an intuitive, modern
          alternative to traditional keys, accessible to all audiences.
        </Text>
      </Box>
      <Box mb="5">
        <Heading mb="3">Meet the Founder</Heading>
        <Flex
          direction={{ initial: "column-reverse", sm: "row" }}
          gap={{ initial: "2", sm: "8" }}
        >
          <Box flexShrink="1">
            <Text as="p" mb="2">
              Hi there! My name is Ethan Saso, and I'm a full-stack developer
              with a lifelong passion for naturalism. I originally created
              Klados under a different name, 'TaxoKeys', in my last semester of
              college as my first web development project. Once I'd picked up
              more experience from my career, I decided to return and rebuild
              the platform from the ground up as Klados, with a focus on
              community contribution and open science.
            </Text>
            <Text as="p" mb="2">
              I graduated from UC Berkeley in 2024 with a degree in Molecular
              Environmental Biology and Computer Science. I previously led the
              university's Mycological Society and have been an active member of
              the bay area mycological community for many years. In my free
              time, I dabble in extreme macro photography of tiny organisms like
              insects, fungi, and slime molds, which you can view over on my{" "}
              <Link href="https://www.inaturalist.org/people/ethansaso">
                iNaturalist
              </Link>
              .
            </Text>
            <Text as="p" mb="2">
              You can also find me on{" "}
              <Link href="https://www.linkedin.com/in/ethansaso/">
                LinkedIn
              </Link>
              .
            </Text>
          </Box>
          <Box asChild flexShrink="0" height="208px" width="208px">
            <img
              src={"/about/ethan-headshot.webp"}
              alt="Ethan Saso"
              height="100%"
              width="100%"
            />
          </Box>
        </Flex>
      </Box>
    </ContentContainer>
  );
}
