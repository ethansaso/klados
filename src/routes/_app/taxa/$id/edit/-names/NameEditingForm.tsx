import {
  Box,
  DataList,
  Flex,
  IconButton,
  RadioGroup,
  Strong,
  Text,
} from "@radix-ui/themes";
import { useCallback, useMemo } from "react";
import { FaDove } from "react-icons/fa";
import { PiPlus } from "react-icons/pi";
import { selectInatNames } from "../-dialogs/InatNameModal";
import { localeDisplayValues } from "../../../../../../lib/consts/locale-display-values";
import { NameItem } from "../../../../../../lib/domain/taxon-names/validation";
import { toast } from "../../../../../../lib/utils/toast";
import { NameRow } from "./NameRow";
import { LocaleEntry } from "./types";

type NameEditingFormProps = {
  value: NameItem[];
  inatId: number | null;
  onChange: (next: NameItem[]) => void;
};

export const NameEditingForm = ({
  value,
  inatId,
  onChange,
}: NameEditingFormProps) => {
  const addRow = () =>
    onChange([...value, { locale: "", value: "", isPreferred: false }]);

  const setFromInat = async () => {
    if (!inatId) {
      toast({
        variant: "error",
        description: "Please set the iNaturalist ID first.",
      });
      return;
    }
    const picked = await selectInatNames(inatId);
    if (picked && picked.length) {
      onChange(picked);
    }
  };

  // Ensure exactly one preferred per locale
  const setPreferredForLocale = useCallback(
    (locale: string, targetIndex: number) => {
      onChange(
        value.map((item, index) =>
          item.locale === locale
            ? { ...item, isPreferred: index === targetIndex }
            : item
        )
      );
    },
    [value, onChange]
  );

  const handleNameChange = useCallback(
    (index: number, nextValue: string) => {
      const next = [...value];
      if (!next[index]) return;
      next[index] = { ...next[index], value: nextValue };
      onChange(next);
    },
    [value, onChange]
  );

  const handleDelete = useCallback(
    (indexToDelete: number) => {
      const target = value[indexToDelete];
      if (!target) return;

      const locale = target.locale;
      const wasPreferred = target.isPreferred;

      const next = value.filter((_, i) => i !== indexToDelete);

      if (wasPreferred) {
        const sameLocale = next
          .map((item, i) => ({ item, i }))
          .filter(({ item }) => item.locale === locale);

        if (sameLocale.length > 0) {
          const [{ item, i }] = sameLocale;
          next[i] = { ...item, isPreferred: true };
        }
      }

      onChange(next);
    },
    [value, onChange]
  );

  // Group + sort locales once per `value` change
  const localeEntries: LocaleEntry[] = useMemo(() => {
    const grouped: Record<string, { item: NameItem; index: number }[]> = {};

    value.forEach((item, index) => {
      const loc = item.locale || "";
      if (!grouped[loc]) grouped[loc] = [];
      grouped[loc].push({ item, index });
    });

    return Object.entries(grouped)
      .map(([code, entries]) => ({
        code,
        entries,
        label: localeDisplayValues[code] ?? code,
      }))
      .sort((a, b) => {
        if (a.code === "sci" && b.code !== "sci") return -1;
        if (b.code === "sci" && a.code !== "sci") return 1;
        return a.label.localeCompare(b.label);
      });
  }, [value]);

  return (
    <Box mb="4">
      <Flex mb="3" gap="1" align="center">
        <Text size="3" mr="1">
          <Strong>Names</Strong>
        </Text>
        <IconButton
          type="button"
          radius="full"
          size="1"
          onClick={addRow}
          aria-label="Add name"
        >
          <PiPlus size="16" />
        </IconButton>
        <IconButton
          type="button"
          radius="full"
          size="1"
          color="grass"
          onClick={setFromInat}
          aria-label="Import names from iNaturalist"
        >
          <FaDove size="16" />
        </IconButton>
      </Flex>

      {localeEntries.length === 0 ? (
        <Text color="gray" size="2">
          No names added yet. Use the + button to add or import from
          iNaturalist.
        </Text>
      ) : (
        <DataList.Root size="2">
          {localeEntries.map(({ code, label: localeLabel, entries }) => {
            const labelId = `taxon-names-locale-${code}`;
            const selected = entries.find((e) => e.item.isPreferred);
            const groupValue =
              selected !== undefined ? String(selected.index) : undefined;

            return (
              <DataList.Item key={code} align="start">
                <DataList.Label id={labelId} minWidth="120px">
                  {localeLabel}
                </DataList.Label>
                <DataList.Value>
                  <RadioGroup.Root
                    size="2"
                    value={groupValue}
                    name={`preferred-${code}`}
                    className="taxon-names__radio-group"
                    aria-labelledby={labelId}
                    onValueChange={(next) => {
                      const idx = Number(next);
                      if (!Number.isNaN(idx)) {
                        setPreferredForLocale(code, idx);
                      }
                    }}
                  >
                    <Flex direction="column" gap="1">
                      {entries.map(({ item, index }) => (
                        <NameRow
                          key={index}
                          localeLabel={localeLabel}
                          item={item}
                          index={index}
                          onNameChange={handleNameChange}
                          onDelete={handleDelete}
                        />
                      ))}
                    </Flex>
                  </RadioGroup.Root>
                </DataList.Value>
              </DataList.Item>
            );
          })}
        </DataList.Root>
      )}
    </Box>
  );
};
