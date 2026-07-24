import { Container, Flex } from "@radix-ui/themes";
import { Outlet } from "@tanstack/react-router";
import type { PropsWithChildren } from "react";

const pPerSize = {
  "0": { px: "1", py: "2" },
  "1": { px: "2", py: "3" },
  "2": { px: "3", py: "4" },
  "3": { px: "4", py: { initial: "4", sm: "6" } },
};

export const ContentContainer = ({
  align = "center",
  p = "3",
  gray,
  className,
  children,
}: PropsWithChildren<{
  className?: string;
  gray?: boolean;
  align?: "start" | "center" | "end" | "baseline" | "stretch";
  p?: "0" | "1" | "2" | "3";
}>) => {
  return (
    <Container
      size={{ initial: undefined, sm: "2", md: "3", lg: "4" }}
      width={{ initial: "100%", sm: undefined }}
      {...pPerSize[p]}
      style={{
        maxWidth: "100%",
        background: gray ? "var(--gray-2)" : undefined,
      }}
      className={className}
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
