import {
  Box,
  Button,
  Flex,
  Popover,
  RadioCards,
  ScrollArea,
  Text,
  TextField,
} from "@radix-ui/themes";
import { Form } from "radix-ui";
import { CSSProperties } from "react";

type Option = { id: number; label: string; hint?: string };

export function SearchableSelectField({
  name,
  label,
  placeholder = "Select…",
  value, // selected Option | null
  onChange, // (opt: Option) => void
  options, // Option[] (provide later; can be paginated)
  className,
  style,
}: {
  name: string;
  label: string;
  placeholder?: string;
  value: Option | null;
  onChange: (opt: Option) => void;
  options: Option[];
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <Form.Field name={name} className={className} style={style}>
      <Text as="div" weight="bold" size="2" mb="1">
        <Form.Label>{label}</Form.Label>
      </Text>

      {/* Hidden input so the form submits the id */}
      <Form.Control asChild>
        <input type="hidden" name={name} value={value?.id ?? ""} />
      </Form.Control>

      <Popover.Root>
        <Popover.Trigger>
          <Button variant="surface" style={{ cursor: "auto" }}>
            {value?.label ?? placeholder}
          </Button>
        </Popover.Trigger>

        <Popover.Content
          side="bottom"
          align="start"
          style={{ width: "var(--trigger-width)" }}
        >
          {/* set the popover width to match trigger */}
          <Box
            style={{
              // compute at open time via CSS var – supported by Radix Themes
              // fallback: measure Trigger width in JS and set here
              minWidth: 280,
            }}
          >
            {/* Search bar */}
            {/* TODO: Replace with your DebouncedTextField and plug into your fetch/filter */}
            <TextField.Root
              mb="2"
              autoFocus
              placeholder={`Search ${label.toLowerCase()}…`}
            />

            {/* Results */}
            <ScrollArea
              type="auto"
              scrollbars="vertical"
              style={{ maxHeight: 260 }}
            >
              <RadioCards.Root
                value={value ? String(value.id) : undefined}
                size="1"
                columns="1"
                onValueChange={(id) => {
                  const picked = options.find((o) => String(o.id) === id);
                  if (picked) onChange(picked);
                }}
              >
                {options.map((opt) => (
                  <RadioCards.Item key={opt.id} value={String(opt.id)}>
                    <Flex direction="column" gap="1">
                      <Text>{opt.label}</Text>
                      {opt.hint && (
                        <Text size="1" color="gray">
                          {opt.hint}
                        </Text>
                      )}
                    </Flex>
                  </RadioCards.Item>
                ))}
              </RadioCards.Root>
            </ScrollArea>
          </Box>
        </Popover.Content>
      </Popover.Root>
    </Form.Field>
  );
}
