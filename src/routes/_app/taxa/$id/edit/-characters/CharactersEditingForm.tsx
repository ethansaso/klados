import { Box, Button, Flex, Heading, Text } from "@radix-ui/themes";
import { replaceEqualDeep } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { PiSparkle } from "react-icons/pi";
import type { TaxonEditFormValues } from "..";
import type { NumberedFeatureCitation } from "../-sources/citableSources";
import {
  characterSearchInputId,
  EditingFeatureCard,
} from "./EditingFeatureCard";
import { selectExtraction } from "./ExtractionModal";
import { type FeatureOption, FeatureSearch } from "./search/FeatureSearch";
import { removeCategoricalTraitValue } from "./stateUtils";
import type { GroupedCharacterFormValue } from "./validation";

type CharacterEditingFormProps = {
  value: GroupedCharacterFormValue;
  citableSources: NumberedFeatureCitation[];
  onChange: (next: GroupedCharacterFormValue) => void;
};

export function CharacterEditingForm({
  value,
  citableSources,
  onChange,
}: CharacterEditingFormProps) {
  const { getValues } = useFormContext<TaxonEditFormValues>();
  const [lastAddedFeatureId, setLastAddedFeatureId] = useState<number | null>(
    null,
  );

  const handleGroupSelect = (option: FeatureOption) => {
    if (value.some((g) => g.featureId === option.id)) return;

    onChange([
      ...value,
      {
        featureId: option.id,
        featureLabel: option.label,
        featureParentId: option.parentId,
        featureSemantics: option.semantics,
        notes: "",
        presence: "present" as const,
        characters: [],
        sourceIds: [],
      },
    ]);
    setLastAddedFeatureId(option.id);
  };

  const handleDeleteGroup = useCallback(
    (groupId: number) => {
      onChange(getValues("states").filter((g) => g.featureId !== groupId));
    },
    [getValues, onChange],
  );

  // Controller hands a deep clone on every change; cheaply compute reference changes *before* handing off values
  const sharedValueRef = useRef(value);
  const sharedValue = useMemo(() => {
    sharedValueRef.current = replaceEqualDeep(sharedValueRef.current, value);
    return sharedValueRef.current;
  }, [value]);

  const sortedGroups = useMemo(
    () =>
      [...sharedValue].sort((a, b) =>
        a.featureLabel.localeCompare(b.featureLabel, undefined, {
          sensitivity: "base",
        }),
      ),
    [sharedValue],
  );

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
          <Heading size="3">Morphology</Heading>
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
          style={{ display: "none" }}
        >
          <PiSparkle size="16" />
          Import text
        </Button>
      </Flex>
      <Box mb="5">
        <FeatureSearch
          onSelect={handleGroupSelect}
          onDownShortcut={
            lastAddedFeatureId != null
              ? () => {
                  document
                    .getElementById(characterSearchInputId(lastAddedFeatureId))
                    ?.focus();
                }
              : undefined
          }
        />
      </Box>
      <Box>
        <div className="feature-card-grid">
          {sortedGroups.map((group) => (
            <EditingFeatureCard
              key={group.featureId}
              feature={group}
              citableSources={citableSources}
              onChange={onChange}
              onDelete={handleDeleteGroup}
              onRemoveCategoricalValue={handleRemoveCategoricalTrait}
            />
          ))}
        </div>
      </Box>
    </Box>
  );
}
