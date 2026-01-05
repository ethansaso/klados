import { Box, Button, Flex, Heading, Text } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";

export const FinalCTA = () => {
  return (
    <Flex
      direction={{ initial: "column", xs: "row" }}
      align="center"
      justify="center"
      p="4"
      gap={{ initial: "4", xs: "6" }}
      className="final-cta"
    >
      <Heading size="7">Ready to get involved?</Heading>
      <Box asChild width={{ initial: "100%", xs: "auto" }}>
        <Button type="button" size="4" radius="full" asChild>
          <Text weight="bold" asChild>
            <Link to="/signup">Join Now</Link>
          </Text>
        </Button>
      </Box>
    </Flex>
  );
};
