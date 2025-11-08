import { Container, Flex } from "@radix-ui/themes";
import { Outlet } from "@tanstack/react-router";
import { PropsWithChildren } from "react";

export const ContentContainer = ({
  align = "center",
  children,
}: PropsWithChildren<{
  align?: "start" | "center" | "end" | "baseline" | "stretch";
}>) => {
  return (
    <Container
      size={{ initial: "2", md: "3", lg: "4" }}
      px="4"
      py="6"
      style={{ maxWidth: "100%" }}
    >
      <Flex direction="column" align={align} gap="4">
        {children}
        <Outlet />
      </Flex>
    </Container>
  );
};
