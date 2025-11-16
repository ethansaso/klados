import { Box, DataList, Flex, Strong, Text } from "@radix-ui/themes";
import { useMemo } from "react";
import { NameItem } from "../../../../lib/serverFns/taxon-names/validation";
import { localeDisplayValues } from "../../../../lib/consts/locale-display-values";

type NamesDataListProps = {
  names: NameItem[];
};

export const NamesDataList = ({ names }: NamesDataListProps) => {
  const localeEntries = useMemo(() => {
    // group by locale
    const grouped: Record<string, NameItem[]> = {};
    names.forEach((item) => {
      const loc = item.locale || "";
      if (!grouped[loc]) grouped[loc] = [];
      grouped[loc].push(item);
    });

    return Object.entries(grouped)
      .map(([code, items]) => {
        const label = localeDisplayValues[code] ?? code;

        // sort: preferred first, then lexicographically
        const sorted = [...items].sort((a, b) => {
          if (a.isPreferred && !b.isPreferred) return -1;
          if (b.isPreferred && !a.isPreferred) return 1;
          return a.value.localeCompare(b.value);
        });

        return { code, label, items: sorted };
      })
      .sort((a, b) => {
        if (a.code === "sci" && b.code !== "sci") return -1;
        if (b.code === "sci" && a.code !== "sci") return 1;
        return a.label.localeCompare(b.label);
      });
  }, [names]);

  if (localeEntries.length === 0) {
    return (
      <Text color="gray" size="2">
        No names available.
      </Text>
    );
  }

  return (
    <Box mb="4">
      <Text size="3" mb="2">
        <Strong>Names</Strong>
      </Text>

      <DataList.Root size="2">
        {localeEntries.map(({ code, label, items }) => (
          <DataList.Item key={code} align="start">
            <DataList.Label minWidth="120px">{label}</DataList.Label>
            <DataList.Value>
              <Flex direction="column" gap="1">
                {items.map((item, idx) => (
                  <Text key={idx}>{item.value}</Text>
                ))}
              </Flex>
            </DataList.Value>
          </DataList.Item>
        ))}
      </DataList.Root>
    </Box>
  );
};
