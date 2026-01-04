import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IconButton, Select, Table, TextField } from "@radix-ui/themes";
import { Controller, useFormContext } from "react-hook-form";
import { PiDotsSixVerticalBold, PiTrash } from "react-icons/pi";
import { TaxonEditFormValues } from "..";
import { MEDIA_LICENSES } from "../../../../../../db/utils/mediaLicense";
import { isUrl } from "../../../../../../lib/utils/isUrl";

type MediaTableRowProps = {
  id: string;
  index: number;
  onRemove: (index: number) => void;
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

export const MediaTableRow = ({ id, index, onRemove }: MediaTableRowProps) => {
  const { control } = useFormContext<TaxonEditFormValues>();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <Table.Row
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
    >
      <Table.Cell>
        <PiDotsSixVerticalBold
          size="16"
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
          {...listeners}
        />
      </Table.Cell>

      <Table.Cell>
        <Controller
          control={control}
          name={`media.${index}.url`}
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
          name={`media.${index}.url`}
          render={({ field }) => {
            const urlValid = field.value === "" ? true : isUrl(field.value);
            return (
              <TextField.Root
                color={urlValid ? undefined : "red"}
                placeholder="https://example.com/image.jpg"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.currentTarget.value)}
              />
            );
          }}
        />
      </Table.Cell>

      <Table.Cell>
        <Controller
          control={control}
          name={`media.${index}.license`}
          render={({ field }) => (
            <Select.Root
              value={field.value ?? "__none__"}
              onValueChange={(v) =>
                field.onChange(v === "__none__" ? undefined : v)
              }
            >
              <Select.Trigger style={{ width: "100%" }}>
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
          name={`media.${index}.owner`}
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
          name={`media.${index}.source`}
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
        <IconButton
          type="button"
          color="tomato"
          aria-label="Remove"
          onClick={() => onRemove(index)}
        >
          <PiTrash />
        </IconButton>
      </Table.Cell>
    </Table.Row>
  );
};
