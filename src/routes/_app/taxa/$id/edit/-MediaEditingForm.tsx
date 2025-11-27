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
import { FaDove } from "react-icons/fa";
import { PiArrowDown, PiArrowUp, PiPlus, PiTrash } from "react-icons/pi";
import { MEDIA_LICENSES } from "../../../../../db/utils/mediaLicense";
import { MediaItem } from "../../../../../lib/api/taxa/validation";
import { toast } from "../../../../../lib/utils/toast";
import { selectInatPhotos } from "./-dialogs/InatPhotoSelectModal";

type MediaEditorProps = {
  value: MediaItem[];
  inatId: number | null;
  onChange: (next: MediaItem[]) => void;
};

const isUrl = (s: string) => {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
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

export const MediaEditingForm = ({
  value,
  inatId,
  onChange,
}: MediaEditorProps) => {
  const addRow = () => onChange([...value, { url: "" }]);
  const removeRow = (i: number) =>
    onChange(value.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const setCell = <K extends keyof MediaItem>(
    i: number,
    key: K,
    val: MediaItem[K]
  ) => {
    const next = [...value];
    next[i] = { ...next[i], [key]: val };
    onChange(next);
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

  const addFromInat = async () => {
    if (!inatId) {
      toast({
        variant: "error",
        description: "Please set the iNaturalist ID first.",
      });
      return;
    }
    const picked = await selectInatPhotos(inatId);
    if (picked && picked.length) {
      const existingUrls = new Set(value.map((item) => item.url));
      const newItems = picked.filter((item) => !existingUrls.has(item.url));
      if (newItems.length > 0) {
        onChange([...value, ...newItems]);
      }
    }
  };

  return (
    <Box mb="4">
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
            <Table.ColumnHeaderCell>Source</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Reorder</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Delete</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {value.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={7}>
                <Text color="gray">
                  No media yet. Add or import some using the buttons above.
                </Text>
              </Table.Cell>
            </Table.Row>
          ) : (
            value.map((m, i) => {
              const urlValid = m.url === "" ? true : isUrl(m.url);
              return (
                <Table.Row key={i}>
                  <Table.RowHeaderCell>{i + 1}</Table.RowHeaderCell>

                  <Table.Cell>
                    <div
                      style={{
                        width: 64,
                        aspectRatio: "1/1",
                        borderRadius: 6,
                        border: "1px solid var(--gray-6)",
                        backgroundColor: "var(--gray-3)",
                        backgroundImage: isValidHttpUrl(m.url)
                          ? `url("${m.url}")`
                          : "none",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                  </Table.Cell>

                  <Table.Cell>
                    <TextField.Root
                      color={urlValid ? undefined : "red"}
                      placeholder="https://example.com/image.jpg"
                      value={m.url}
                      onChange={(e) => setCell(i, "url", e.currentTarget.value)}
                    />
                  </Table.Cell>

                  <Table.Cell>
                    <Select.Root
                      value={m.license ?? "__none__"}
                      onValueChange={(v) =>
                        setCell(
                          i,
                          "license",
                          v === "__none__"
                            ? undefined
                            : (v as MediaItem["license"])
                        )
                      }
                    >
                      <Select.Trigger>
                        {m.license ? ELIGIBLE[m.license] : "—"}
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
                  </Table.Cell>

                  <Table.Cell>
                    <TextField.Root
                      placeholder="Owner / photographer"
                      value={m.owner ?? ""}
                      onChange={(e) =>
                        setCell(i, "owner", e.currentTarget.value || undefined)
                      }
                    />
                  </Table.Cell>

                  <Table.Cell>
                    <TextField.Root
                      placeholder="Source or link"
                      value={m.source ?? ""}
                      onChange={(e) =>
                        setCell(i, "source", e.currentTarget.value || undefined)
                      }
                    />
                  </Table.Cell>

                  <Table.Cell>
                    <Flex gap="2">
                      <IconButton
                        type="button"
                        variant="soft"
                        aria-label="Move up"
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                      >
                        <PiArrowUp />
                      </IconButton>
                      <IconButton
                        type="button"
                        variant="soft"
                        aria-label="Move down"
                        onClick={() => move(i, +1 as 1)}
                        disabled={i === value.length - 1}
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
                      onClick={() => removeRow(i)}
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
