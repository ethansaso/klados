import "./ClosingSection.css";

import { Box, Button, Flex, Heading, Text, Theme } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import { PiArrowRight, PiHeartFill } from "react-icons/pi";

/** Full-width dark bookend to the hero: how to keep Klados going. */
export const ClosingSection = () => (
  <Theme asChild appearance="dark" hasBackground={false}>
    <Flex
      direction="column"
      align="center"
      py={{ initial: "8", sm: "9" }}
      px="6"
      width="100%"
      className="closing-section"
    >
      <Heading
        as="h2"
        size={{ initial: "7", sm: "8" }}
        align="center"
        mb="3"
        wrap="balance"
        className="hero-text"
      >
        Free for everyone, always
      </Heading>
      <Text
        as="p"
        size="4"
        align="center"
        mb="4"
        wrap="balance"
        className="hero-text"
        style={{ maxWidth: 520 }}
      >
        Klados is kept online out of pocket. If it&rsquo;s helped you learn,
        consider chipping in to keep it running and growing.
      </Text>
      <Flex
        gap="3"
        direction={{ initial: "column", xs: "row" }}
        width={{ initial: "100%", xs: "auto" }}
      >
        <Box asChild width={{ initial: "100%", xs: "auto" }}>
          <Button size="3" radius="full" asChild>
            <Link to="/donate">
              <PiHeartFill />
              Support Klados
            </Link>
          </Button>
        </Box>
        <Box asChild width={{ initial: "100%", xs: "auto" }}>
          <Button
            size="3"
            radius="full"
            highContrast
            variant="solid"
            color="gray"
            asChild
          >
            <Link to="/curators/new">
              Become a curator
              <PiArrowRight />
            </Link>
          </Button>
        </Box>
      </Flex>
    </Flex>
  </Theme>
);
