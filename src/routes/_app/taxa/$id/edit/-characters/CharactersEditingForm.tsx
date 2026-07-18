import { Box, Button } from "@radix-ui/themes";
import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { PiSparkle } from "react-icons/pi";
import type { TaxonEditFormValues } from "..";
import { FormDescriptor } from "../../../../../../components/FormDescriptor";
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
    <FormDescriptor
      title="Characters"
      description="To add a character, first use the group search to add a character group. Once added, you can select trait values for the characters in that group."
      actions={
        <Button
          type="button"
          radius="full"
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
          Import text description
        </Button>
      }
    >
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
    </FormDescriptor>
  );
}
