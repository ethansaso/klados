import {
  Box,
  Button,
  Flex,
  SegmentedControl,
  Text,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import { Label } from "radix-ui";
import { PropsWithChildren } from "react";
import { Controller, useFormContext } from "react-hook-form";
import {
  a11yProps,
  ConditionalAlert,
} from "../../../../../components/inputs/ConditionalAlert";
import type { CreateCharacterInput } from "../../../../../lib/domain/characters/validation";
import { useAutoKey } from "../../../../../lib/hooks/useAutoKey";

export function AddCharacterBaseForm({ children }: PropsWithChildren) {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<CreateCharacterInput>();

  const { autoKey, setAutoKey, handleKeyBlur } = useAutoKey(
    control,
    setValue,
    "label",
    "key"
  );

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
            placeholder="e.g. cap color, spore diameter"
            {...register("label")}
            {...a11yProps("label-error", !!errors.label)}
          />
        </Box>

        <Box>
          <Flex justify="between" align="baseline" mb="1">
            <Label.Root htmlFor="key">Key</Label.Root>
            <Flex align="center" gap="2">
              <ConditionalAlert id="key-error" message={errors.key?.message} />
              <Text size="1" color="gray">
                {autoKey ? "Auto" : "Manual"}
              </Text>
              <Button
                size="1"
                variant="soft"
                type="button"
                onClick={() => setAutoKey((v) => !v)}
              >
                {autoKey ? "Edit" : "Use auto"}
              </Button>
            </Flex>
          </Flex>
          <TextField.Root
            id="key"
            type="text"
            readOnly={autoKey}
            {...register("key", { onBlur: handleKeyBlur })}
            {...a11yProps("key-error", !!errors.key)}
          />
        </Box>

        {children}

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
