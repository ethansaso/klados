import { Box, Flex, RadioCards, Strong, Text } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import { PropsWithChildren } from "react";

interface RootProps {
  selectedId: string | undefined;
}

function Root({ children, selectedId }: PropsWithChildren<RootProps>) {
  return (
    <RadioCards.Root
      orientation="vertical"
      gap="1"
      size="1"
      columns="1"
      value={selectedId ?? "__unset__"}
    >
      {children}
    </RadioCards.Root>
  );
}

interface ItemProps {
  id: number | string;
  keyStr: string;
  label: string;
  to: string;
  params?: Record<string, string | number>;
}

function Item({
  id,
  keyStr,
  label,
  to,
  params,
  children,
}: PropsWithChildren<ItemProps>) {
  return (
    <Link
      to={to}
      params={params}
      search={true}
      preload="intent"
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <RadioCards.Item value={String(id)} style={{ width: "100%" }}>
        <Flex width="100%" gap="5" justify="between">
          <Box flexShrink="1" style={{ minWidth: 0 }}>
            <Text as="p" truncate>
              <Strong>{label}</Strong>
            </Text>
            <Text as="p" size="1" color="gray" truncate>
              {keyStr}
            </Text>
          </Box>
          <Flex direction="column" align="end" justify="start">
            {children}
          </Flex>
        </Flex>
      </RadioCards.Item>
    </Link>
  );
}

export const CharacterSectionSidebarList = {
  Root,
  Item,
};
