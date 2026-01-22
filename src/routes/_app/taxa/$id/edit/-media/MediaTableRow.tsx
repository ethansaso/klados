import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IconButton, Select, Table, TextField } from "@radix-ui/themes";
import { Controller, useFormContext } from "react-hook-form";
import { PiDotsSixVerticalBold, PiTrash } from "react-icons/pi";
import z from "zod";
import { TaxonEditFormValues } from "..";
import {
  HUMAN_CASED_MEDIA_LICENSES,
  MEDIA_LICENSES,
} from "../../../../../../db/utils/mediaLicense";

type MediaTableRowProps = {
  id: string;
  index: number;
  onRemove: (index: number) => void;
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

      <Controller
        control={control}
        name={`media.${index}.url`}
        render={({ field }) => {
          const urlValid = z
            .union([z.url(), z.literal("")])
            .safeParse(field.value).success;
          return (
            <>
              <Table.Cell>
                <div
                  style={{
                    width: 48,
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
              </Table.Cell>

              <Table.Cell>
                <TextField.Root
                  color={urlValid ? undefined : "red"}
                  size="1"
                  placeholder="https://example.com/image.jpg"
                  value={field.value}
                  onChange={(e) => field.onChange(e.currentTarget.value)}
                />
              </Table.Cell>
            </>
          );
        }}
      />

      <Table.Cell>
        <Controller
          control={control}
          name={`media.${index}.license`}
          render={({ field }) => (
            <Select.Root
              size="1"
              value={field.value}
              onValueChange={(v) => field.onChange(v)}
            >
              <Select.Trigger style={{ width: "100%" }}>
                {
                  HUMAN_CASED_MEDIA_LICENSES[
                    field.value as keyof typeof HUMAN_CASED_MEDIA_LICENSES
                  ]
                }
              </Select.Trigger>
              <Select.Content>
                {MEDIA_LICENSES.map((lic) => (
                  <Select.Item key={lic} value={lic}>
                    {HUMAN_CASED_MEDIA_LICENSES[lic]}
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
              size="1"
              placeholder="Owner / photographer"
              value={field.value}
              onChange={(e) => field.onChange(e.currentTarget.value)}
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
              size="1"
              value={field.value}
              onChange={(e) => field.onChange(e.currentTarget.value)}
            />
          )}
        />
      </Table.Cell>

      <Table.Cell>
        <IconButton
          type="button"
          size="1"
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
