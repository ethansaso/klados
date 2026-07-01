import { Box, Card, Flex, ScrollArea, Text } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import { NavigationMenu } from "radix-ui";
import { type PropsWithChildren, type ReactNode } from "react";

function List({ children }: PropsWithChildren) {
  return (
    <ScrollArea
      type="hover"
      size="1"
      scrollbars="vertical"
      className="glossary-sidebar__list"
    >
      <NavigationMenu.Root orientation="vertical">
        <Flex asChild px="3" py="1" m="0" direction="column" gap="1">
          <NavigationMenu.List>{children}</NavigationMenu.List>
        </Flex>
      </NavigationMenu.Root>
    </ScrollArea>
  );
}

interface ItemProps {
  label: ReactNode;
  to: string;
  params?: Record<string, string | number>;
  search?: Record<string, string | number>;
}

function Item({
  label,
  to,
  params,
  search,
  children,
}: PropsWithChildren<ItemProps>) {
  return (
    <NavigationMenu.Item asChild>
      <Card asChild style={{ width: "100%" }}>
        <Link
          to={to}
          params={params}
          search={search}
          preload="intent"
          activeOptions={{ includeSearch: false }}
        >
          <Flex width="100%" gap="5" align="center" justify="between">
            <Box flexShrink="1" style={{ minWidth: 0 }}>
              <Text as="p" size="2" truncate className="glossary-label">
                {label}
              </Text>
            </Box>
            {children}
          </Flex>
        </Link>
      </Card>
    </NavigationMenu.Item>
  );
}

export const GlossarySidebarList = {
  List,
  Item,
};
