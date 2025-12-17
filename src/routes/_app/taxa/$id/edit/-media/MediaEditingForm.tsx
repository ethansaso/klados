import {
  Box,
  Flex,
  IconButton,
  Select,
  Strong,
  Table,
  Text,
  TextField,
} from "@radix-ui/themes";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { FaDove } from "react-icons/fa";
import { PiArrowDown, PiArrowUp, PiPlus, PiTrash } from "react-icons/pi";
import { TaxonEditFormValues } from "..";
import { MEDIA_LICENSES } from "../../../../../../db/utils/mediaLicense";
import { isUrl } from "../../../../../../lib/utils/isUrl";
import { toast } from "../../../../../../lib/utils/toast";
import { selectInatPhotos } from "./InatPhotoSelectModal";

type MediaEditorProps = {
  inatId: number | null;
};

const ELIGIBLE: Record<(typeof MEDIA_LICENSES)[number], string> = {
  cc0: "CC0",
  "cc-by": "CC BY",
  "cc-by-sa": "CC BY-SA",
  "cc-by-nd": "CC BY-ND",
  "cc-by-nc": "CC BY-NC",
  "cc-by-nc-sa": "CC BY-NC-SA",
  "cc-by-nc-nd": "CC BY-NC-ND",
  "all-rights-reserved": "All Rights Reserved",
};

export const MediaEditingForm = ({ inatId }: MediaEditorProps) => {
  const { control, getValues } = useFormContext<TaxonEditFormValues>();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "media",
  });

  const addRow = () => append({ url: "" });

  const addFromInat = async () => {
    if (!inatId) {
      toast({
        variant: "error",
        description: "Please set the iNaturalist ID first.",
      });
      return;
    }
    const picked = await selectInatPhotos(inatId);
    if (!picked?.length) return;

    const existingUrls = new Set(getValues("media").map((m) => m.url));
    const newItems = picked.filter((m) => !existingUrls.has(m.url));
    if (newItems.length) append(newItems);
  };

  // Helper which checks for valid HTTP/HTTPS URL before attempting to render preview
  const isValidHttpUrl = (s?: string) => {
    if (!s) return false;
    try {
      const u = new URL(s);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  return (
    <Box mb="5">
      <Flex mb="3" gap="1">
        <Text size="3" mr="1">
          <Strong>Media</Strong>
        </Text>
        <IconButton type="button" radius="full" size="1" onClick={addRow}>
          <PiPlus size="16" />
        </IconButton>
        <IconButton
          type="button"
          radius="full"
          size="1"
          color="grass"
          onClick={addFromInat}
        >
          <FaDove size="16" />
        </IconButton>
      </Flex>
      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>#</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Preview</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Image URL</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>License</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Owner</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Source URL</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Reorder</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Delete</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {fields.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={7}>
                <Text color="gray">
                  No media yet. Add or import some using the buttons above.
                </Text>
              </Table.Cell>
            </Table.Row>
          ) : (
            fields.map((row, i) => {
              // note: row is from RHF; read current values via Controllers below
              return (
                <Table.Row key={row.id}>
                  <Table.RowHeaderCell>{i + 1}</Table.RowHeaderCell>

                  <Table.Cell>
                    <Controller
                      control={control}
                      name={`media.${i}.url`}
                      render={({ field }) => (
                        <div
                          style={{
                            width: 64,
                            aspectRatio: "1/1",
                            borderRadius: 6,
                            border: "1px solid var(--gray-6)",
                            backgroundColor: "var(--gray-3)",
                            backgroundImage: isValidHttpUrl(field.value)
                              ? `url("${field.value}")`
                              : "none",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        />
                      )}
                    />
                  </Table.Cell>

                  <Table.Cell>
                    <Controller
                      control={control}
                      name={`media.${i}.url`}
                      render={({ field }) => {
                        const urlValid =
                          field.value === "" ? true : isUrl(field.value);
                        return (
                          <TextField.Root
                            color={urlValid ? undefined : "red"}
                            placeholder="https://example.com/image.jpg"
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(e.currentTarget.value)
                            }
                          />
                        );
                      }}
                    />
                  </Table.Cell>

                  <Table.Cell>
                    <Controller
                      control={control}
                      name={`media.${i}.license`}
                      render={({ field }) => (
                        <Select.Root
                          value={field.value ?? "__none__"}
                          onValueChange={(v) =>
                            field.onChange(v === "__none__" ? undefined : v)
                          }
                        >
                          <Select.Trigger>
                            {field.value
                              ? ELIGIBLE[field.value as keyof typeof ELIGIBLE]
                              : "—"}
                          </Select.Trigger>
                          <Select.Content>
                            <Select.Item value="__none__">—</Select.Item>
                            {MEDIA_LICENSES.map((lic) => (
                              <Select.Item key={lic} value={lic}>
                                {ELIGIBLE[lic]}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Root>
                      )}
                    />
                  </Table.Cell>

                  <Table.Cell>
                    <Controller
                      control={control}
                      name={`media.${i}.owner`}
                      render={({ field }) => (
                        <TextField.Root
                          placeholder="Owner / photographer"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.currentTarget.value || undefined)
                          }
                        />
                      )}
                    />
                  </Table.Cell>

                  <Table.Cell>
                    <Controller
                      control={control}
                      name={`media.${i}.source`}
                      render={({ field }) => (
                        <TextField.Root
                          placeholder="Source or link"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.currentTarget.value || undefined)
                          }
                        />
                      )}
                    />
                  </Table.Cell>

                  <Table.Cell>
                    <Flex gap="2">
                      <IconButton
                        type="button"
                        variant="soft"
                        aria-label="Move up"
                        onClick={() => move(i, i - 1)}
                        disabled={i === 0}
                      >
                        <PiArrowUp />
                      </IconButton>
                      <IconButton
                        type="button"
                        variant="soft"
                        aria-label="Move down"
                        onClick={() => move(i, i + 1)}
                        disabled={i === fields.length - 1}
                      >
                        <PiArrowDown />
                      </IconButton>
                    </Flex>
                  </Table.Cell>

                  <Table.Cell>
                    <IconButton
                      type="button"
                      color="tomato"
                      aria-label="Remove"
                      onClick={() => remove(i)}
                    >
                      <PiTrash />
                    </IconButton>
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
