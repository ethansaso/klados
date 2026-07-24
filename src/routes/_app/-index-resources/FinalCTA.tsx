import { Box, Button, Flex, Heading, Text, Theme } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";

export const FinalCTA = () => {
  return (
    <Theme asChild appearance="light">
      <Flex
        direction={{ initial: "column", xs: "row" }}
        align="center"
        justify="center"
        py="5"
        px="6"
        gap={{ initial: "4", xs: "6" }}
        className="final-cta"
      >
        <Heading as="h2" size="7">
          Ready to get involved?
        </Heading>
        <Box asChild width={{ initial: "100%", xs: "auto" }}>
          <Button type="button" size="4" radius="full" asChild>
            <Text weight="bold" asChild>
              <Link to="/signup">Join Now</Link>
            </Text>
          </Button>
        </Box>
      </Flex>
    </Theme>
  );
};
