import {
  Box,
  Checkbox,
  Flex,
  SegmentedControl,
  Text,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import { Label } from "radix-ui";
import { type PropsWithChildren } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import {
  a11yProps,
  ConditionalAlert,
} from "../../../../../components/inputs/ConditionalAlert";
import type { CreateCharacterInput } from "../../../../../lib/domain/characters/validation";

// Illustrative example state per type, used to preview showInProse.
const EXAMPLE_STATE: Record<CreateCharacterInput["type"], string> = {
  categorical: "indistinct",
  number: "12 mm",
  range: "12-13 mm",
};

export function AddCharacterBaseForm({ children }: PropsWithChildren) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<CreateCharacterInput>();

  const label = useWatch({ control, name: "label" });
  const type = useWatch({ control, name: "type" });
  const showInProse = useWatch({ control, name: "showInProse" });
  const preview = showInProse
    ? `${label.trim() || "[label]"} ${EXAMPLE_STATE[type]}`
    : EXAMPLE_STATE[type];

  return (
    <>
      <Controller
        name="type"
        control={control}
        render={({ field }) => (
          <Box mb="3">
            <Box mb="1">
              <Label.Root htmlFor="type">Character Type</Label.Root>
            </Box>
            <SegmentedControl.Root
              value={field.value}
              onValueChange={field.onChange}
            >
              <SegmentedControl.Item value="categorical">
                Categorical
              </SegmentedControl.Item>
              <SegmentedControl.Item value="number">
                Number
              </SegmentedControl.Item>
              <SegmentedControl.Item value="range">Range</SegmentedControl.Item>
            </SegmentedControl.Root>
          </Box>
        )}
      />

      <Flex direction="column" gap="3" mb="4">
        <Box>
          <Flex justify="between" align="baseline" mb="1">
            <Label.Root htmlFor="label">Label</Label.Root>
            <ConditionalAlert
              id="label-error"
              message={errors.label?.message}
            />
          </Flex>
          <TextField.Root
            id="label"
            type="text"
            placeholder="e.g. color, diameter, shape"
            {...register("label")}
            {...a11yProps("label-error", !!errors.label)}
          />
        </Box>

        {children}

        <Box>
          <Flex gap="2" align="center">
            <Controller
              name="showInProse"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  id="show-in-prose"
                />
              )}
            />
            <Label.Root htmlFor="show-in-prose">Show label in prose</Label.Root>
          </Flex>
          <Text as="div" size="1" color="gray" mt="1">
            Will display as: "{preview}"
          </Text>
        </Box>

        <Box>
          <Flex justify="between" align="baseline" mb="1">
            <Label.Root htmlFor="description">Description</Label.Root>
            <ConditionalAlert
              id="description-error"
              message={errors.description?.message}
            />
          </Flex>
          <TextArea
            id="description"
            placeholder="Optional description for this character"
            {...register("description")}
            {...a11yProps("description-error", !!errors.description)}
          />
        </Box>
      </Flex>
    </>
  );
}
