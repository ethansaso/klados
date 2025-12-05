import { Box, Button, Flex, Heading, Text } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import { PiArrowRight } from "react-icons/pi";

export const HeroSection = () => {
  return (
    <Flex
      align="center"
      justify="center"
      style={{
        backgroundImage: "url(/about/forest-bg.jpeg)",
        backgroundSize: "cover",
        backgroundPosition: "0 50%",
        height: 496,
        width: "100%",
        // darken by 50%
        backgroundBlendMode: "darken",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        color: "white",
      }}
    >
      <Flex
        direction="column"
        gap="4"
        maxWidth="600px"
        style={{ textAlign: "center" }}
      >
        <Heading size="9">Visual tools to identify organisms.</Heading>
        <Text size="6">
          Browse thousands of species and explore interactive,
          community-maintained guides built from real biological data.
        </Text>
        <Box>
          <Button size="4" asChild radius="full">
            <Link to="/taxa">
              Browse Species
              <PiArrowRight />
            </Link>
          </Button>
        </Box>
      </Flex>
    </Flex>
  );
};
