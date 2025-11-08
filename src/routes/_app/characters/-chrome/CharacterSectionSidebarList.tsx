import { Box, Flex, RadioCards, Text } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import { PropsWithChildren } from "react";

interface RootProps {
  selectedId: string | undefined;
}

// TODO: fix not resetting on nav to parent path, e.g. clicking on "option sets" when viewing an option set
function Root({ children, selectedId }: PropsWithChildren<RootProps>) {
  return (
    <RadioCards.Root
      orientation="vertical"
      gap="1"
      size="1"
      columns="1"
      value={selectedId}
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

function Item({ id, keyStr, label, to, params }: ItemProps) {
  return (
    <Link
      to={to}
      params={params}
      search={true}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <RadioCards.Item value={String(id)} style={{ width: "100%" }}>
        <Flex width="100%" gap="2" justify="between" align="start">
          <Box flexShrink="1" style={{ minWidth: 0 }}>
            <Text as="p">{label}</Text>
            <Text as="p" size="1" color="gray">
              {keyStr}
            </Text>
          </Box>
          <Box>asdf</Box>
        </Flex>
      </RadioCards.Item>
    </Link>
  );
}

export const CharacterSectionSidebarList = {
  Root,
  Item,
};
