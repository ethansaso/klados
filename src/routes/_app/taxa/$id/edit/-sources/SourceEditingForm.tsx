import {
  Box,
  Flex,
  IconButton,
  Strong,
  Table,
  Text,
  TextArea,
  TextField,
  Tooltip,
} from "@radix-ui/themes";
import React, { Dispatch } from "react";
import { PiClockClockwise, PiPlus, PiTrash } from "react-icons/pi";
import { SourceDTO } from "../../../../../../lib/domain/sources/types";
import {
  SetTaxonSourcesInput,
  TaxonSourceUpsertItem,
} from "../../../../../../lib/domain/taxon-sources/validation";
import { formatPublication } from "../../../../../../lib/utils/formatPublication";
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
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  return (
    <Box mb="5">
      <Flex mb="3" gap="1" align="center">
        <Text size="3" mr="1">
          <Strong>Sources</Strong>
        </Text>
        <IconButton
          type="button"
          radius="full"
          size="1"
          onClick={async () => {
            const picked = await pickSource();
            if (!picked) return;
            if (sourcesById.has(picked.id)) return;

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
        </IconButton>
      </Flex>

      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Publication</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Locator</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Accessed</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Notes</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell />
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {value.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={5}>
                <Text color="gray">
                  No sources yet. Add one using the plus button above.
                </Text>
              </Table.Cell>
            </Table.Row>
          ) : (
            value.map((item, i) => {
              const src = sourcesById.get(item.sourceId);

              return (
                <Table.Row key={`${item.sourceId}`}>
                  <Table.Cell>
                    {src ? (
                      <Text>{formatPublication(src)}</Text>
                    ) : (
                      <Text color="tomato">
                        Error: Source not found for ID {item.sourceId}
                      </Text>
                    )}
                  </Table.Cell>

                  <Table.Cell>
                    <TextField.Root
                      placeholder='e.g. "Vol. 1, pp. 79-82"'
                      value={item.locator}
                      onChange={(e) =>
                        setItem(i, { locator: e.currentTarget.value })
                      }
                    />
                  </Table.Cell>

                  <Table.Cell>
                    <Flex gap="2" align="center">
                      <Text>{toDateInputValue(item.accessedAt)}</Text>
                      <Tooltip content="Set accessed date to today">
                        <IconButton
                          type="button"
                          variant="soft"
                          size="1"
                          onClick={() => setItem(i, { accessedAt: new Date() })}
                        >
                          <PiClockClockwise />
                        </IconButton>
                      </Tooltip>
                    </Flex>
                  </Table.Cell>

                  <Table.Cell>
                    <TextArea
                      value={item.note}
                      onChange={(e) =>
                        setItem(i, { note: e.currentTarget.value })
                      }
                    />
                  </Table.Cell>

                  <Table.Cell>
                    <Flex gap="2" justify="end" align="center">
                      <Tooltip content="Remove source">
                        <IconButton
                          type="button"
                          color="tomato"
                          size="1"
                          onClick={() => removeRow(i)}
                        >
                          <PiTrash />
                        </IconButton>
                      </Tooltip>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              );
            })
          )}
        </Table.Body>
      </Table.Root>
    </Box>
  );
};
