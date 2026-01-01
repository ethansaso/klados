import { Box, Flex, IconButton, TextField } from "@radix-ui/themes";
import { Label } from "radix-ui";
import { useController, useFormContext } from "react-hook-form";
import { PiX } from "react-icons/pi";
import { a11yProps, ConditionalAlert } from "./ConditionalAlert";

type Props = {
  name: string;
  label: string;
  disabled?: boolean;
};

const HEX_RE = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;

function toDomId(name: string) {
  return `field-${name.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

export function ClearableColorField({ name, label, disabled = false }: Props) {
  const {
    control,
    formState: { errors, touchedFields, isSubmitted },
  } = useFormContext();

  const { field } = useController({ control, name });

  const id = toDomId(name);
  const errorId = `${id}-error`;

  const value = typeof field.value === "string" ? field.value.trim() : "";
  const hasColor = value.length > 0;

  const rawErr = errors?.[name]?.message;
  const hasTouched = touchedFields?.[name] || isSubmitted;
  const errorMessage =
    hasTouched && typeof rawErr === "string" ? rawErr : undefined;

  // Black fallback when color is cleared
  const pickerValue = hasColor && HEX_RE.test(value) ? value : "#ffffff";

  return (
    <Box>
      <Flex mb="1" align="baseline" justify="between">
        <Label.Root htmlFor={id}>{label}</Label.Root>
        <ConditionalAlert id={errorId} message={errorMessage} />
      </Flex>
      <TextField.Root
        id={id}
        placeholder="#RRGGBB"
        value={value}
        disabled={disabled}
        onChange={(e) => field.onChange(e.target.value.trim())}
        onBlur={field.onBlur}
        style={{
          overflow: "hidden",
          position: "relative",
          isolation: "isolate",
        }}
        {...a11yProps(errorId, !!errorMessage)}
      >
        <TextField.Slot px="2" side="left">
          <label
            style={{
              background: hasColor ? value : "transparent",
              borderRadius: "var(--radius-2)",
              border: "1px solid var(--gray-6)",
              height: "var(--space-5)",
              width: "var(--space-5)",
            }}
          >
            <input
              type="color"
              value={pickerValue}
              disabled={disabled}
              aria-label={`${label} picker`}
              onChange={(e) => field.onChange(e.target.value)}
              style={{
                visibility: "hidden",
              }}
            />
          </label>
        </TextField.Slot>
        <TextField.Slot side="right">
          <IconButton
            type="button"
            size="1"
            variant="ghost"
            color="gray"
            disabled={disabled || !hasColor}
            onClick={() => field.onChange("")}
            aria-label={`Clear ${label}`}
          >
            <PiX />
          </IconButton>
        </TextField.Slot>
      </TextField.Root>
    </Box>
  );
}
