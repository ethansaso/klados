import { Box, Button, Flex, Heading, Text } from "@radix-ui/themes";
import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { PiSparkle } from "react-icons/pi";
import type { TaxonEditFormValues } from "..";
import type { ComboboxOption } from "../../../../../../components/inputs/combobox/types";
import { EditingFeatureCard } from "./EditingFeatureCard";
import { selectExtraction } from "./ExtractionModal";
import { FeatureSearch } from "./search/FeatureSearch";
import { removeCategoricalTraitValue } from "./stateUtils";
import type { GroupedCharacterFormValue } from "./validation";

type CharacterEditingFormProps = {
  value: GroupedCharacterFormValue;
  onChange: (next: GroupedCharacterFormValue) => void;
};

export function CharacterEditingForm({
  value,
  onChange,
}: CharacterEditingFormProps) {
  const { getValues } = useFormContext<TaxonEditFormValues>();

  const handleGroupSelect = (option: ComboboxOption) => {
    if (value.some((g) => g.featureId === option.id)) return;

    onChange([
      ...value,
      {
        featureId: option.id,
        featureLabel: option.label,
        notes: "",
        characters: [],
      },
    ]);
  };

  const handleDeleteGroup = (groupId: number) => {
    onChange(value.filter((g) => g.featureId !== groupId));
  };

  // getValues is stable, so these callbacks are stable
  const handleRemoveCategoricalTrait = useCallback(
    (groupId: number, characterId: number, stateIndex: number) => {
      const prev = getValues("states");
      const next = removeCategoricalTraitValue(
        prev,
        groupId,
        characterId,
        stateIndex,
      );
      onChange(next);
    },
    [getValues, onChange],
  );

  return (
    <Box width="100%">
      <Flex mb="2" gap="8" width="100%" justify="between" align="center">
        <Box>
          <Heading size="3">Characters</Heading>
          <Text color="gray" size="2">
            Add features and character states using the input boxes. Click on
            any character state to attach modifiers.
          </Text>
        </Box>

        <Button
          type="button"
          size="1"
          color="iris"
          onClick={async () => {
            const result = await selectExtraction();
            if (result) {
              console.log("Extraction result:", result);
            }
          }}
          aria-label="Extract states from text description"
        >
          <PiSparkle size="16" />
          Import text
        </Button>
      </Flex>
      <Box>
        <Box mb="4">
          <FeatureSearch onSelect={handleGroupSelect} />
        </Box>
        <div className="feature-card-grid">
          {value.map((group) => (
            <EditingFeatureCard
              key={group.featureId}
              feature={group}
              onChange={onChange}
              onDelete={() => handleDeleteGroup(group.featureId)}
              onRemoveCategoricalValue={handleRemoveCategoricalTrait}
            />
          ))}
        </div>
      </Box>
    </Box>
  );
}
