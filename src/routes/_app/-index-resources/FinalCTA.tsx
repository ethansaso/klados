import { Button, Flex, Heading, Text } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";

export const FinalCTA = () => {
  return (
    <Flex align="center" justify="center" p="4" gap="6" className="final-cta">
      <Heading size="7">Ready to get involved?</Heading>
      <Button type="button" size="4" radius="full" asChild>
        <Text weight="bold" asChild>
          <Link to="/signup">Join Now</Link>
        </Text>
      </Button>
    </Flex>
  );
};
