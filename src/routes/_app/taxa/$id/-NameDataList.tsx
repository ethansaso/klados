import { DataList, Flex, Text } from "@radix-ui/themes";
import { useMemo } from "react";
import { localeDisplayValues } from "../../../../lib/consts/locale-display-values";
import { NameItem } from "../../../../lib/domain/taxon-names/validation";

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
    <DataList.Root size="2">
      {localeEntries.map(({ code, label, items }) => (
        <DataList.Item key={code} align="start">
          <DataList.Label minWidth="120px">{label}</DataList.Label>
          <DataList.Value>
            <Flex direction="column" gap="1">
              {items.map((item, idx) => (
                <Text
                  key={idx}
                  color={
                    item.locale === "sci" && !item.isPreferred
                      ? "gray"
                      : undefined
                  }
                >
                  {item.value}
                </Text>
              ))}
            </Flex>
          </DataList.Value>
        </DataList.Item>
      ))}
    </DataList.Root>
  );
};
