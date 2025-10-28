import { Container, Flex } from "@radix-ui/themes";
import { Outlet } from "@tanstack/react-router";

export const ContentContainer = () => {
  return (
    <Container
      size={{ initial: "2", md: "3", lg: "4" }}
      px="4"
      py="6"
      style={{ maxWidth: "100%" }}
    >
      <Flex justify="center" gap="4">
        <Outlet />
      </Flex>
    </Container>
  );
};
