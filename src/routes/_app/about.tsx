import { Box, Em, Flex, Heading, Link, Text } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import { ContentContainer } from "../../components/ContentContainer";

export const Route = createFileRoute("/_app/about")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ContentContainer>
      <Box mb="5">
        <Heading mb="3">What is Klados?</Heading>
        <Text as="p" mb="2">
          Klados is a community-oriented taxonomy platform that provides both a
          free repository of morphological data and a modern interface for
          creating and sharing flowchart-style identification guides known as
          "dichotomous keys".
        </Text>
        <Text as="p" size="2">
          <Em>
            Disclaimer: Klados is currently in early alpha. Generated keys
            and/or taxon descriptions may contain errors and should be reviewed
            before acceptance.
          </Em>
        </Text>
      </Box>
      <Box mb="5">
        <Heading mb="3">Our Mission</Heading>
        <Text as="p" mb="2">
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
        <Flex gap="8">
          <Box>
            <Text as="p" mb="2">
              Hi there! My name is Ethan Saso, and I'm a full-stack developer
              with a lifelong passion for naturalism. I originally created
              Klados under a different name, 'TaxoKeys', at the end of college
              as my first web development project. After taking a hiatus for
              work, I decided to return and rebuild the platform from the ground
              up as Klados, with a focus on community contribution and open
              science.
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
          <img
            src={"/about/ethan-headshot.jpeg"}
            alt="Ethan Saso"
            height="208px"
          />
        </Flex>
      </Box>
    </ContentContainer>
  );
}
