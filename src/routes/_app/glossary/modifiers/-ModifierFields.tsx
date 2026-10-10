import {
  Box,
  Flex,
  SegmentedControl,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import { Label } from "radix-ui";
import { Controller, useFormContext } from "react-hook-form";
import z from "zod";
import { MediaField } from "../-MediaField";
import { AFFIX_TYPES } from "../../../../../db/schema/schema";
import {
  a11yProps,
  ConditionalAlert,
} from "../../../../components/inputs/ConditionalAlert";
import type { MediaDTO } from "../../../../lib/domain/media/types";
import {
  trimmed,
  trimmedNonEmpty,
} from "../../../../lib/validation/trimmedOptional";

export const modifierFormSchema = z.object({
  label: trimmedNonEmpty("Please provide a label.", {
    max: { value: 200, message: "Max 200 characters" },
  }),
  description: trimmed("Must be a string").max(1000, "Max 1000 characters"),
  affixType: z.enum(AFFIX_TYPES),
  media: z.custom<MediaDTO>().nullable(),
});

export type ModifierFormValues = z.infer<typeof modifierFormSchema>;

type Props = {
  disabled?: boolean;
};

export function ModifierFields({ disabled = false }: Props) {
  const {
    control,
    register,
    getValues,
    formState: { errors, touchedFields, isSubmitted },
  } = useFormContext<ModifierFormValues>();

  return (
    <>
      <Box>
        <Flex justify="between" align="baseline" mb="1">
          <Label.Root htmlFor="label">Label</Label.Root>
          <ConditionalAlert
            id="label-error"
            message={
              touchedFields.label || isSubmitted
                ? errors.label?.message
                : undefined
            }
          />
        </Flex>
        <TextField.Root
          id="label"
          placeholder="e.g. at maturity, becoming, slightly"
          disabled={disabled}
          {...register("label")}
          {...a11yProps("label-error", !!errors.label)}
        />
      </Box>

      <Box>
        <Box mb="1">
          <Label.Root>Placement</Label.Root>
        </Box>
        <Controller
          control={control}
          name="affixType"
          render={({ field }) => (
            <SegmentedControl.Root
              value={field.value}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <SegmentedControl.Item value="prefix">
                Prefix
              </SegmentedControl.Item>
              <SegmentedControl.Item value="suffix">
                Suffix
              </SegmentedControl.Item>
            </SegmentedControl.Root>
          )}
        />
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
          disabled={disabled}
          {...register("description")}
          {...a11yProps("description-error", !!errors.description)}
        />
      </Box>

      <Box>
        <Flex justify="between" align="baseline" mb="1">
          <Label.Root htmlFor="media">Media</Label.Root>
        </Flex>
        <Controller
          control={control}
          name="media"
          render={({ field }) => (
            <MediaField
              id="media"
              value={field.value}
              onChange={field.onChange}
              getWikimediaQuery={() => getValues("label")}
              disabled={disabled}
            />
          )}
        />
      </Box>
    </>
  );
}
