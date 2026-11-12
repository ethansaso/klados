import { Box, Checkbox, Flex, Text } from "@radix-ui/themes";
import { Label } from "radix-ui";

type Props = {
  id: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

export function FieldDiagnosableField({
  id,
  value,
  onChange,
  disabled,
}: Props) {
  const hintId = `${id}-hint`;

  return (
    <Box>
      <Flex gap="2" align="center">
        <Checkbox
          id={id}
          checked={value}
          onCheckedChange={(checked) => onChange(checked === true)}
          disabled={disabled}
          aria-describedby={hintId}
        />
        <Label.Root htmlFor={id}>Field-diagnosable</Label.Root>
      </Flex>
      <Text as="div" id={hintId} size="1" color="gray">
        This feature can{value ? "" : "not"} be reliably observed at a glance,
        without chemicals, a microscope, or other tools.
      </Text>
    </Box>
  );
}
