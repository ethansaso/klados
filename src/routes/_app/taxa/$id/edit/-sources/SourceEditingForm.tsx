import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  IconButton,
  Text,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import React, { type Dispatch } from "react";
import { PiClockClockwise, PiPlus, PiTrash } from "react-icons/pi";
import { ResponsiveTooltip } from "../../../../../../components/ResponsiveTooltip";
import type { SourceDTO } from "../../../../../../lib/domain/sources/types";
import type {
  SetTaxonSourcesInput,
  TaxonSourceUpsertItem,
} from "../../../../../../lib/domain/taxon-sources/validation";
import { parseSourceFields } from "../../../../../../lib/utils/formatting/formatPublication";
import { pickSource } from "./SourcePickerModal";

type SourceEditorProps = {
  value: SetTaxonSourcesInput;
  sourcesById: Map<number, SourceDTO>;
  setSourcesById: Dispatch<React.SetStateAction<Map<number, SourceDTO>>>;
  onChange: (next: SetTaxonSourcesInput) => void;
};

/** Date in local time */
function toDateInputValue(d: Date): string {
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export const SourceEditingForm = ({
  value,
  onChange,
  sourcesById,
  setSourcesById,
}: SourceEditorProps) => {
  const removeRow = (i: number) =>
    onChange(value.filter((_, idx) => idx !== i));

  const setItem = (i: number, patch: Partial<TaxonSourceUpsertItem>) => {
    const next = [...value];
    const current = next[i];

    if (!current) {
      throw new Error(`Invariant violation: no source at index ${i}`);
    }

    next[i] = { ...current, ...patch };
    onChange(next);
  };

  return (
    <Box>
      <Flex justify="between" mb="2">
        <Heading size="3">Sources</Heading>
        <Button
          type="button"
          radius="full"
          size="1"
          onClick={async () => {
            const picked = await pickSource();
            if (!picked) return;
            if (value.some((item) => item.sourceId === picked.id)) return;

            setSourcesById((prev) => new Map(prev).set(picked.id, picked));
            onChange([
              ...value,
              {
                sourceId: picked.id,
                accessedAt: new Date(),
                locator: "",
                note: "",
              },
            ]);
          }}
        >
          <PiPlus size="16" />
          Add Source
        </Button>
      </Flex>
      <Flex direction="column" gap="2">
        {value.map((item, i) => {
          const src = sourcesById.get(item.sourceId);
          const parsed = src ? parseSourceFields(src) : null;

          return (
            <Card key={`${item.sourceId}`}>
              <Flex direction="column" gap="1">
                <Flex gap="2" justify="between">
                  {parsed ? (
                    <Text size="1" as="p">
                      <Text weight="bold" as="p">
                        {parsed.title}
                      </Text>
                      {parsed.authorAndYear && (
                        <Text as="p">{parsed.authorAndYear}</Text>
                      )}
                      {parsed.publisher && (
                        <Text as="p">{parsed.publisher}</Text>
                      )}
                    </Text>
                  ) : (
                    <Text color="tomato">
                      Error: Source not found for ID {item.sourceId}
                    </Text>
                  )}
                  <ResponsiveTooltip content="Remove source">
                    <IconButton
                      type="button"
                      variant="ghost"
                      color="tomato"
                      size="1"
                      onClick={() => removeRow(i)}
                    >
                      <PiTrash />
                    </IconButton>
                  </ResponsiveTooltip>
                </Flex>

                <Flex gap="2" align="center">
                  <Box flexGrow="1">
                    <TextField.Root
                      size="1"
                      placeholder='Locator, e.g. "Vol. 1, pp. 79-82"'
                      value={item.locator}
                      onChange={(e) =>
                        setItem(i, { locator: e.currentTarget.value })
                      }
                    />
                  </Box>
                  <Box>
                    <Flex gap="2" align="center">
                      <Text size="1" color="gray">
                        {toDateInputValue(item.accessedAt)}
                      </Text>
                      <ResponsiveTooltip content="Set accessed date to today">
                        <IconButton
                          type="button"
                          variant="ghost"
                          size="1"
                          onClick={() => setItem(i, { accessedAt: new Date() })}
                        >
                          <PiClockClockwise />
                        </IconButton>
                      </ResponsiveTooltip>
                    </Flex>
                  </Box>
                </Flex>

                <Box>
                  <TextArea
                    size="1"
                    rows={1}
                    placeholder="Notes"
                    value={item.note}
                    onChange={(e) =>
                      setItem(i, { note: e.currentTarget.value })
                    }
                  />
                </Box>
              </Flex>
            </Card>
          );
        })}
      </Flex>
    </Box>
  );
};
