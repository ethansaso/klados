import {
  Box,
  DataList,
  Flex,
  IconButton,
  RadioGroup,
  Strong,
  Text,
  TextField,
} from "@radix-ui/themes";
import { useMemo, useState } from "react";
import { FaDove } from "react-icons/fa";
import { PiPencilSimple, PiPlus, PiTrash } from "react-icons/pi";
import { localeDisplayValues } from "../../../../../lib/consts/locale-display-values";
import { NameItem } from "../../../../../lib/serverFns/taxon-names/validation";
import { toast } from "../../../../../lib/utils/toast";
import { selectInatNames } from "./-dialogs/InatNameModal";

type NameEditorProps = {
  value: NameItem[];
  inatId: number | null;
  onChange: (next: NameItem[]) => void;
};

export const NameEditingForm = ({
  value,
  inatId,
  onChange,
}: NameEditorProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftValue, setDraftValue] = useState("");

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
      setEditingIndex(null);
      setDraftValue("");
    }
  };

  // Ensure exactly one preferred per locale
  const setPreferredForLocale = (locale: string, targetIndex: number) => {
    onChange(
      value.map((item, index) =>
        item.locale === locale
          ? { ...item, isPreferred: index === targetIndex }
          : item
      )
    );
  };

  const commitEdit = () => {
    if (editingIndex === null) return;

    const trimmed = draftValue.trim();
    if (!trimmed) {
      // For now, just cancel if empty. You could instead treat this as delete.
      setEditingIndex(null);
      setDraftValue("");
      return;
    }

    const idx = editingIndex;
    if (!value[idx]) {
      setEditingIndex(null);
      setDraftValue("");
      return;
    }

    const next = [...value];
    next[idx] = { ...next[idx], value: trimmed };
    onChange(next);

    setEditingIndex(null);
    setDraftValue("");
  };

  const startEditing = (index: number, currentValue: string) => {
    if (editingIndex !== null && editingIndex !== index) {
      // Auto-commit the previous edit before switching
      commitEdit();
    }
    setEditingIndex(index);
    setDraftValue(currentValue);
  };

  const handleDelete = (indexToDelete: number) => {
    const target = value[indexToDelete];
    if (!target) return;

    const locale = target.locale;
    const wasPreferred = target.isPreferred;

    const next = value.filter((_, i) => i !== indexToDelete);

    // If we deleted the preferred name, optionally reassign within the same locale
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

    if (editingIndex !== null) {
      if (editingIndex === indexToDelete) {
        setEditingIndex(null);
        setDraftValue("");
      } else if (editingIndex > indexToDelete) {
        setEditingIndex(editingIndex - 1);
      }
    }
  };

  // Group names by locale
  const namesByLocale = value.reduce<
    Record<string, { item: NameItem; index: number }[]>
  >((acc, item, index) => {
    const loc = item.locale || "";
    if (!acc[loc]) acc[loc] = [];
    acc[loc].push({ item, index });
    return acc;
  }, {});

  // Build { code, label, entries } and sort by *label*,
  // with scientific names first.
  const localeEntries = useMemo(
    () =>
      Object.entries(namesByLocale)
        .map(([code, entries]) => ({
          code,
          entries,
          label: localeDisplayValues[code] ?? code,
        }))
        .sort((a, b) => {
          if (a.code === "sci" && b.code !== "sci") return -1;
          if (b.code === "sci" && a.code !== "sci") return 1;
          return a.label.localeCompare(b.label);
        }),
    [namesByLocale]
  );

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
                      {entries.map(({ item, index }) => {
                        const isEditing = editingIndex === index;

                        return (
                          <Flex
                            key={index}
                            align="center"
                            gap="2"
                            className="taxon-names__item"
                          >
                            <Flex
                              align="center"
                              gap="2"
                              className="taxon-names__item__label"
                            >
                              <RadioGroup.Item value={String(index)}>
                                {!isEditing && (
                                  <Text
                                    as="span"
                                    color={item.value ? undefined : "gray"}
                                  >
                                    {item.value || "(empty)"}
                                  </Text>
                                )}
                              </RadioGroup.Item>
                              {isEditing && (
                                <TextField.Root
                                  size="1"
                                  value={draftValue}
                                  autoFocus
                                  aria-label={`Edit ${localeLabel} name`}
                                  onChange={(e) =>
                                    setDraftValue(e.target.value)
                                  }
                                  onBlur={commitEdit}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      commitEdit();
                                    }
                                    if (e.key === "Escape") {
                                      setEditingIndex(null);
                                      setDraftValue("");
                                    }
                                  }}
                                />
                              )}
                            </Flex>

                            <Flex
                              align="center"
                              gap="2"
                              className="taxon-names__item__actions"
                            >
                              <IconButton
                                size="1"
                                variant="ghost"
                                type="button"
                                onClick={() =>
                                  startEditing(index, item.value || "")
                                }
                                aria-label="Edit name"
                              >
                                <PiPencilSimple size={12} />
                              </IconButton>

                              <IconButton
                                size="1"
                                variant="ghost"
                                color="tomato"
                                type="button"
                                onClick={() => handleDelete(index)}
                                aria-label="Delete name"
                              >
                                <PiTrash size={12} />
                              </IconButton>
                            </Flex>
                          </Flex>
                        );
                      })}
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
