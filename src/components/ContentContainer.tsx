import { Container, Flex } from "@radix-ui/themes";
import { Outlet } from "@tanstack/react-router";
import { PropsWithChildren } from "react";

const pPerSize = {
  "1": { px: "2", py: "3" },
  "2": { px: "3", py: "4" },
  "3": { px: "4", py: "6" },
};

export const ContentContainer = ({
  align = "center",
  p = "3",
  children,
}: PropsWithChildren<{
  align?: "start" | "center" | "end" | "baseline" | "stretch";
  p?: "1" | "2" | "3";
}>) => {
  return (
    <Container
      size={{ initial: "2", md: "3", lg: "4" }}
      {...pPerSize[p]}
      style={{ maxWidth: "100%" }}
    >
      <Flex direction="column" align={align}>
        {children}
      </Flex>
    </Container>
  );
};

export const ContentOutlet = ({
  align = "center",
  children,
}: PropsWithChildren<{
  align?: "start" | "center" | "end" | "baseline" | "stretch";
}>) => {
  return (
    <ContentContainer align={align}>
      {children}
      <Outlet />
    </ContentContainer>
  );
};
