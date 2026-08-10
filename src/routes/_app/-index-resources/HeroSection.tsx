import { Box, Button, Flex, Heading, Text, Theme } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import { PiArrowRight } from "react-icons/pi";
import { AnnotatedSpeciesCard } from "./AnnotatedSpeciesCard";

export const HeroSection = () => {
  return (
    <Flex
      align="center"
      justify="center"
      py="7"
      px="6"
      minHeight={{ initial: "60svh", sm: "512px" }}
      width="100%"
      style={{
        backgroundImage: "url(/about/forest-bg.webp)",
        backgroundSize: "cover",
        backgroundPosition: "0 50%",
        // darken by 50%
        backgroundBlendMode: "darken",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
      }}
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
            mb="2"
            className="hero-text"
          >
            A structured language for identification.
          </Heading>
          <Text
            size={{ initial: "5", sm: "6" }}
            align={{ initial: "left", xs: "center", xl: "left" }}
            mb="5"
            className="hero-text"
          >
            Explore biodiversity using interactive resources grounded in
            biological data.
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
