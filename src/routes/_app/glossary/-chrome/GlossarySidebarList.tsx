import { Box, Card, Flex, Text } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import { NavigationMenu } from "radix-ui";
import { PropsWithChildren } from "react";

function Root({ children }: PropsWithChildren) {
  return (
    <NavigationMenu.Root orientation="vertical">
      <Flex asChild p="0" m="0" direction="column" gap="1">
        <NavigationMenu.List>{children}</NavigationMenu.List>
      </Flex>
    </NavigationMenu.Root>
  );
}

interface ItemProps {
  keyStr: string;
  label: string;
  to: string;
  params?: Record<string, string | number>;
}

function Item({
  keyStr,
  label,
  to,
  params,
  children,
}: PropsWithChildren<ItemProps>) {
  return (
    <NavigationMenu.Item asChild>
      <Card asChild style={{ width: "100%" }}>
        <Link to={to} params={params} search preload="intent">
          <Flex width="100%" gap="5" justify="between">
            <Box flexShrink="1" style={{ minWidth: 0 }}>
              <Text as="p" size="2" truncate className="glossary-label">
                {label}
              </Text>
              <Text as="p" size="1" color="gray" truncate>
                {keyStr}
              </Text>
            </Box>
            <Flex direction="column" align="end" justify="start">
              {children}
            </Flex>
          </Flex>
        </Link>
      </Card>
    </NavigationMenu.Item>
  );
}

export const GlossarySidebarList = {
  Root,
  Item,
};
