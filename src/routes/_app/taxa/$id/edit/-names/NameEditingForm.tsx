import {
  Box,
  Button,
  DataList,
  Flex,
  Heading,
  RadioGroup,
  Text,
} from "@radix-ui/themes";
import { useCallback, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { FaDove } from "react-icons/fa";
import { v4 as uuidv4 } from "uuid";
import type { TaxonEditFormValues } from "..";
import { localeDisplayValues } from "../../../../../../lib/utils/localeDisplayValues";
import { toast } from "../../../../../../lib/utils/toast";
import { selectInatNames } from "./InatNameModal";
import { NameRow } from "./NameRow";
import type { LocaleEntry } from "./types";
import type { NameItemForm } from "./validation";

type NameEditingFormProps = {
  inatId: number | null;
  onChange: (next: NameItemForm[]) => void;
};

export const NameEditingForm = ({ inatId, onChange }: NameEditingFormProps) => {
  const { watch, getValues } = useFormContext<TaxonEditFormValues>();
  const value = watch("names");
  // const addRow = () =>
  //   onChange([...value, { locale: "", value: "", isPreferred: false }]);

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
      onChange(picked.map((n) => ({ ...n, _formId: uuidv4() })));
    }
  };

  // Ensure exactly one preferred per locale
  const setPreferredForLocale = useCallback(
    (locale: string, targetId: string) => {
      const value = getValues("names");
      onChange(
        value.map((item) =>
          item.locale === locale
            ? { ...item, isPreferred: item._formId === targetId }
            : item,
        ),
      );
    },
    [onChange],
  );

  const handleNameChange = useCallback(
    (id: string, nextValue: string) => {
      const next = getValues("names").map((n) =>
        n._formId === id ? { ...n, value: nextValue } : n,
      );
      onChange(next);
    },
    [onChange],
  );

  const handleDelete = useCallback(
    (id: string) => {
      const value = getValues("names");
      const target = value.find((n) => n._formId === id);
      if (!target) return;

      const next = value.filter((n) => n._formId !== id);

      if (target.isPreferred) {
        const firstSameLocale = next.find((n) => n.locale === target.locale);
        if (firstSameLocale) {
          firstSameLocale.isPreferred = true;
        }
      }

      onChange([...next]);
    },
    [onChange],
  );

  // Group + sort locales once per `value` change
  const localeEntries: LocaleEntry[] = useMemo(() => {
    const grouped: Record<string, { item: NameItemForm }[]> = {};

    value.forEach((item) => {
      const loc = item.locale || "";
      if (!grouped[loc]) grouped[loc] = [];
      grouped[loc].push({ item });
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
    <Box>
      <Flex mb="2" align="center" justify="between">
        <Heading size="3">Names</Heading>
        <Button
          type="button"
          radius="full"
          size="1"
          color="grass"
          onClick={setFromInat}
          aria-label="Import names from iNaturalist"
        >
          <FaDove size="16" />
          Import from iNaturalist
        </Button>
      </Flex>

      {localeEntries.length === 0 ? (
        <Text color="gray" size="2">
          No names added yet. Use the + button to add or import from
          iNaturalist.
        </Text>
      ) : (
        <DataList.Root size="1">
          {localeEntries.map(({ code, label: localeLabel, entries }) => {
            const labelId = `taxon-names-locale-${code}`;
            const selected = entries.find((e) => e.item.isPreferred);
            const groupValue = selected?.item._formId;

            return (
              <DataList.Item key={code} align="start">
                <DataList.Label id={labelId} minWidth="120px">
                  {localeLabel}
                </DataList.Label>
                <DataList.Value>
                  <RadioGroup.Root
                    size="1"
                    value={groupValue}
                    name={`preferred-${code}`}
                    className="taxon-names__radio-group"
                    aria-labelledby={labelId}
                    onValueChange={(id) => {
                      setPreferredForLocale(code, id);
                    }}
                  >
                    <Flex direction="column" gap="1">
                      {entries.map(({ item }) => (
                        <NameRow
                          key={item._formId}
                          id={item._formId}
                          localeLabel={localeLabel}
                          value={item.value}
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
