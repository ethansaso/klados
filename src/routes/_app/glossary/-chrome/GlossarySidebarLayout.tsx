import { Flex, Separator as RadixSeparator } from "@radix-ui/themes";
import { Outlet } from "@tanstack/react-router";
import { PropsWithChildren } from "react";
import { ContentContainer } from "../../../../components/ContentContainer";

function Root({ children }: PropsWithChildren) {
  return (
    <Flex
      height={{ initial: "auto", sm: "0" }}
      flexGrow="1"
      direction={{ initial: "column", sm: "row" }}
    >
      {children}
    </Flex>
  );
}

function Sidebar({ children }: PropsWithChildren) {
  return (
    <Flex
      direction="column"
      width={{ initial: "auto", sm: "275px" }}
      height="100%"
      p="1"
    >
      {children}
    </Flex>
  );
}

function Separator() {
  return (
    <RadixSeparator
      orientation={{ initial: "horizontal", sm: "vertical" }}
      size="4"
    />
  );
}

function Content() {
  return (
    <>
      <ContentContainer align="stretch">
        <Outlet />
      </ContentContainer>
    </>
  );
}

export const GlossarySidebarLayout = {
  Root,
  Sidebar,
  Separator,
  Content,
};
