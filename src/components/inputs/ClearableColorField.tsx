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
      <Label.Root htmlFor={id}>{label}</Label.Root>
      <Flex gap="2" align="center">
        <TextField.Root
          id={id}
          placeholder="#RRGGBB"
          value={value}
          disabled={disabled}
          onChange={(e) => field.onChange(e.target.value.trim())}
          onBlur={field.onBlur}
          style={{ overflow: "hidden" }}
          {...a11yProps(errorId, !!errorMessage)}
        >
          <TextField.Slot
            side="left"
            px="0"
            style={{
              height: "100%",
              width: "40px",
              marginRight: "var(--space-2)",
            }}
          >
            <label
              style={{
                background: hasColor ? value : "transparent",
                height: "110%",
                width: "100%",
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
      </Flex>

      <ConditionalAlert id={errorId} message={errorMessage} />
    </Box>
  );
}
