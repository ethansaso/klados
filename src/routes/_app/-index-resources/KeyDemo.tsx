import { Box, Button, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import { PiArrowRightBold } from "react-icons/pi";
import { KeyDemoCanvas } from "../../../components/react-flow-keys/demo/KeyDemoCanvas";

export const KeyDemo = () => {
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
          <Box maxWidth={{ sm: "380px" }}>
            <Heading size="8" mb="4">
              A Clearer Way to Navigate Biodiversity
            </Heading>
            <Text as="p" mb="3" size="4">
              Klados turns complex morphological data into clear, readable
              flowcharts.
            </Text>
            <Text as="p" mb="5" size="4">
              Its free, community-driven guides offer a visually rich
              alternative to traditional dichotomous keys.
            </Text>
            <Box width={{ initial: "100%", xs: "auto" }} asChild>
              <Button type="button" radius="full" size="3" asChild>
                <Link to="/keys">
                  Explore guides
                  <PiArrowRightBold />
                </Link>
              </Button>
            </Box>
          </Box>
          <KeyDemoCanvas />
        </Flex>
      </Container>
    </Box>
  );
};
