import { Box, Button, Flex, Heading, Text, Theme } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import { PiArrowRight } from "react-icons/pi";
import { GlossaryCard } from "../../../components/glossary-cards/GlossaryCard";
import { AnnotatedSpeciesCard } from "./AnnotatedSpeciesCard";
import "./HeroSection.css";

export const HeroSection = () => {
  return (
    <Flex
      className="hero-section"
      align="center"
      justify="center"
      py="7"
      px="6"
      minHeight={{ initial: "60svh", sm: "528px" }}
      width="100%"
    >
      <Flex
        direction={{ initial: "column", xl: "row" }}
        align="center"
        justify="center"
        gap={{ initial: "7", xl: "8" }}
        width="100%"
        maxWidth="1264px"
      >
        <Flex
          direction="column"
          align={{ initial: "start", xs: "center", xl: "start" }}
          maxWidth={{ initial: "600px", xl: "544px" }}
          style={{
            color: "white",
          }}
        >
          <Heading
            size={{ initial: "8", sm: "9" }}
            align={{ initial: "left", xs: "center", xl: "left" }}
            mb="3"
            className="hero-text"
          >
            A shared language for identification.
          </Heading>
          <Text
            size={{ initial: "5", sm: "6" }}
            align={{ initial: "left", xs: "center", xl: "left" }}
            mb="5"
            className="hero-text"
          >
            Explore{" "}
            <GlossaryCard
              info={{
                title: "Biodiversity",
                description: "The variety of life on Earth.",
                media: null,
              }}
            >
              <span className="has-information">biodiversity</span>
            </GlossaryCard>{" "}
            using interactive resources grounded in{" "}
            <GlossaryCard
              info={{
                title: "Structured data",
                description:
                  "Data in a standardized format defined by a strict set of rules, in contrast to unstructured data like raw prose.",
                media: null,
              }}
            >
              <span className="has-information">structured data</span>
            </GlossaryCard>
            .
          </Text>
          <Flex
            gap="3"
            direction={{ initial: "column", xs: "row" }}
            width={{ initial: "100%", xs: "auto" }}
          >
            <Box asChild width={{ initial: "100%", xs: "auto" }}>
              <Button size={{ initial: "3", sm: "4" }} asChild radius="full">
                <Link to="/taxa">
                  Browse species
                  <PiArrowRight />
                </Link>
              </Button>
            </Box>
            <Theme appearance="dark" hasBackground={false}>
              <Box asChild width={{ initial: "100%", xs: "auto" }}>
                <Button
                  size={{ initial: "3", sm: "4" }}
                  asChild
                  radius="full"
                  highContrast
                  variant="solid"
                  color="gray"
                >
                  <Link to="/guides">
                    Explore guides
                    <PiArrowRight />
                  </Link>
                </Button>
              </Box>
            </Theme>
          </Flex>
        </Flex>

        <Box className="hero-figure" display={{ initial: "none", md: "block" }}>
          <AnnotatedSpeciesCard />
        </Box>
      </Flex>
    </Flex>
  );
};
