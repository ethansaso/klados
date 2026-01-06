import { Box, Button, Flex, Heading, Text } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import { PiArrowRight } from "react-icons/pi";

export const HeroSection = () => {
  return (
    <Flex
      align="center"
      justify="center"
      py="6"
      px="6"
      minHeight={{ initial: "60dvh", sm: "496px" }}
      width="100%"
      style={{
        backgroundImage: "url(/about/forest-bg.jpeg)",
        backgroundSize: "cover",
        backgroundPosition: "0 50%",
        // darken by 50%
        backgroundBlendMode: "darken",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        color: "white",
      }}
    >
      <Flex
        direction="column"
        align={{ initial: "start", xs: "center" }}
        gap="4"
        maxWidth="600px"
      >
        <Heading
          size={{ initial: "8", sm: "9" }}
          align={{ initial: "left", xs: "center" }}
          className="hero-text"
        >
          Visual tools to identify organisms.
        </Heading>
        <Text
          size={{ initial: "5", sm: "6" }}
          align={{ initial: "left", xs: "center" }}
          className="hero-text"
        >
          Browse thousands of species and explore interactive,
          community-maintained guides built from real biological data.
        </Text>
        <Box asChild width={{ initial: "100%", xs: "auto" }}>
          <Button size={{ initial: "3", sm: "4" }} asChild radius="full">
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
