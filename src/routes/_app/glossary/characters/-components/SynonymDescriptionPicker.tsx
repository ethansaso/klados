import { Button, DropdownMenu, Flex, Text } from "@radix-ui/themes";
import type { DescriptionSuggestion } from "../-synonymSuggestions";
import "./SynonymDescriptionPicker.css";

type Props = {
  suggestions: DescriptionSuggestion[];
  loading: boolean;
  onPick: (text: string) => void;
  disabled?: boolean;
};

/** "From synonym" menu that fills the description with a synonym's. */
export function SynonymDescriptionPicker({
  suggestions,
  loading,
  onPick,
  disabled = false,
}: Props) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger disabled={disabled || !suggestions.length}>
        <Button type="button" size="1" variant="soft" loading={loading}>
          From synonym
          <DropdownMenu.TriggerIcon />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        align="end"
        size="1"
        className="synonym-description-picker__menu"
      >
        <DropdownMenu.Label>Use a synonym's description</DropdownMenu.Label>
        {suggestions.map(({ text, labels }) => (
          <DropdownMenu.Item
            key={text}
            onSelect={() => onPick(text)}
            className="synonym-description-picker__item"
          >
            <Flex direction="column" minWidth="0" flexGrow="1">
              <Text weight="medium" truncate>
                {labels.join(", ")}
              </Text>
              <Text
                color="gray"
                className="synonym-description-picker__preview"
              >
                {text}
              </Text>
            </Flex>
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
