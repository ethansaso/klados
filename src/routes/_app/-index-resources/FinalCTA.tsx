import { Button, Flex, Heading, Text } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";

export const FinalCTA = () => {
  return (
    <Flex align="center" justify="center" p="4" gap="6" className="final-cta">
      <Heading size="7">Ready to learn more?</Heading>
      <Button size="4" radius="full" asChild>
        <Link to="/signup">
          <Text weight="bold">Join Now</Text>
        </Link>
      </Button>
    </Flex>
  );
};
