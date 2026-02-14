import { Box, Checkbox, Flex, Text } from "@radix-ui/themes";
import { Label } from "radix-ui";
import { Controller, useFormContext } from "react-hook-form";
import type { CreateCharacterInput } from "../../../../../lib/domain/characters/validation";

type CreateCategoricalCharacterInput = Extract<
  CreateCharacterInput,
  { type: "categorical" }
>;

export function AddCategoricalCharacterForm() {
  const { control } = useFormContext<CreateCategoricalCharacterInput>();

  return (
    <>
      <Box>
        <Flex gap="2" align="center">
          <Controller
            name="isMultiSelect"
            control={control}
            render={({ field }) => (
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                id="is-multi-select"
              />
            )}
          />
          <Label.Root htmlFor="is-multi-select">
            Allow multiple selections
          </Label.Root>
        </Flex>
        <Text as="div" size="1" color="gray" mt="1">
          If disabled, taxa can only be assigned a single trait for this
          character.
        </Text>
      </Box>
    </>
  );
}
