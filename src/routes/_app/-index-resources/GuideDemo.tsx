import { Box, Button, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import { PiArrowRightBold } from "react-icons/pi";
import { GlossaryCard } from "../../../components/glossary-cards/GlossaryCard";
import { GuideDemoCanvas } from "../../../components/react-flow-guides/demo/GuideDemoCanvas";

export const GuideDemo = () => {
  return (
    <Box width="100%" px="6">
      <Container
        pt="8"
        pb="7"
        size={{ sm: "2", md: "3", lg: "4" }}
        width="100%"
      >
        <Flex
          direction={{ initial: "column", sm: "row" }}
          width="100%"
          gap={{ initial: "6", sm: "9" }}
          align="center"
        >
          <GuideDemoCanvas />
          <Box maxWidth={{ sm: "380px" }}>
            <Heading as="h2" size={{ initial: "7", sm: "8" }} mb="4">
              Visual-first identification guides
            </Heading>
            <Text as="p" mb="3" size="4">
              Klados turns complex{" "}
              <GlossaryCard
                info={{
                  title: "Morphological",
                  description:
                    "Related to the form or structure of an organism.",
                  media: null,
                }}
              >
                <span className="has-information">morphological</span>
              </GlossaryCard>{" "}
              data into clear, readable flowcharts.
            </Text>
            <Text as="p" mb="5" size="4">
              Its free, community-driven guides offer a visually rich
              alternative to traditional{" "}
              <GlossaryCard
                info={{
                  title: "Dichotomous key",
                  description:
                    "A step-by-step identification guide for a group of organisms that relies on a series of two-choice questions.",
                  media: null,
                }}
              >
                <span className="has-information">dichotomous keys</span>
              </GlossaryCard>
              .
            </Text>
            <Box width={{ initial: "100%", xs: "auto" }} asChild>
              <Button type="button" radius="full" size="3" asChild>
                <Link to="/guides">
                  Explore guides
                  <PiArrowRightBold />
                </Link>
              </Button>
            </Box>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
};
