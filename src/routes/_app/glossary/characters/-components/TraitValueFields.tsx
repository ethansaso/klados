import { Box, Flex, Text, TextArea, TextField } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { Label } from "radix-ui";
import { useMemo, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import z from "zod";
import { useSynonymSetMembers } from "../-hooks/useSynonymSetMembers";
import { distinctDescriptions, distinctMedia } from "../-synonymSuggestions";
import { MediaField } from "../../-MediaField";
import { SelectCombobox } from "../../../../../components/inputs/combobox/SelectCombobox";
import type { ComboboxOption } from "../../../../../components/inputs/combobox/types";
import {
  a11yProps,
  ConditionalAlert,
} from "../../../../../components/inputs/ConditionalAlert";
import { ColorBubble } from "../../../../../components/state-formatting/helpers/ColorBubble";
import type { MediaDTO } from "../../../../../lib/domain/media/types";
import { synonymCandidatesQueryOptions } from "../../../../../lib/queries/traits";
import {
  trimmed,
  trimmedNonEmpty,
} from "../../../../../lib/validation/trimmedOptional";
import { SynonymDescriptionPicker } from "./SynonymDescriptionPicker";

const SYNONYM_CANDIDATE_LIMIT = 20;

export type TraitValueMembership = z.infer<typeof membershipSchema>;
export type TraitValueFormValues = z.infer<typeof traitValueFormSchema>;

/** Null to signal sole membership */
export const membershipSchema = z
  .object({
    synonymSetId: z.int().positive(),
    /** Any member of the set to place it in -- doesn't matter which one */
    traitId: z.int().positive(),
    /** Labels of other members, a display concern riding w/ the trait in the form */
    labels: z.array(z.string()),
    /** The set's swatch, likewise for display */
    hexCode: z.string().nullable(),
  })
  .nullable();

export const traitValueFormSchema = z.object({
  label: trimmedNonEmpty("Please provide a label.", {
    max: { value: 200, message: "Max 200 characters" },
  }),
  description: trimmed("Must be a string").max(1000, "Max 1000 characters"),
  media: z.custom<MediaDTO>().nullable(),
  membership: membershipSchema,
});

/** Locked sets admit no new sets, so a label must join (or stay in) one. */
export const lockedTraitValueFormSchema = traitValueFormSchema.refine(
  (values) => values.membership !== null,
  {
    path: ["membership"],
    message: "Required for locked characters.",
  },
);

type Props = {
  characterId: number;
  /** Keeps trait from appearing in own synonyms list (i.e. for editing extant trait) */
  excludeTraitId?: number;
  /** Canonical labels of locked sets keep their label and set. */
  isCanonical?: boolean;
  disabled?: boolean;
};

export function TraitValueFields({
  characterId,
  excludeTraitId,
  isCanonical = false,
  disabled = false,
}: Props) {
  const {
    control,
    register,
    getValues,
    setValue,
    formState: { errors, touchedFields, isSubmitted },
  } = useFormContext<TraitValueFormValues>();

  const [synonymQuery, setSynonymQuery] = useState("");
  const membership = useWatch({ control, name: "membership" });

  const { members, isLoading: membersLoading } = useSynonymSetMembers(
    characterId,
    membership?.synonymSetId ?? null,
    excludeTraitId,
  );

  const { data: candidates, isFetching: candidatesLoading } = useQuery(
    synonymCandidatesQueryOptions(characterId, synonymQuery, {
      excludeTraitId,
      limit: SYNONYM_CANDIDATE_LIMIT,
    }),
  );

  /** Keyed by set for edge case where synonyms change while editing trait. */
  const candidateOptions: ComboboxOption[] = useMemo(
    () =>
      (candidates ?? []).map((c) => ({
        id: c.synonymSetId,
        label: c.labels[0] ?? "",
        hint: c.labels.length > 1 ? `+ ${c.labels.slice(1).join(", ")}` : "",
        adornment: swatch(c.hexCode),
      })),
    [candidates],
  );

  /** Trigger references a single synonym for payload, but labels w/ all synonyms. */
  const selectedOption: ComboboxOption | null = membership && {
    id: membership.synonymSetId,
    label: membership.labels.join(", "),
    adornment: swatch(membership.hexCode),
  };

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
          placeholder="e.g. red, convex, farinaceous"
          disabled={disabled}
          // Read-only rather than disabled, so the label still submits
          readOnly={isCanonical}
          {...register("label")}
          {...a11yProps("label-error", !!errors.label)}
        />
        {isCanonical && (
          <Text as="p" size="1" color="gray" mt="1">
            Canonical terms can't be renamed or assigned to other synonym sets.
          </Text>
        )}
      </Box>

      <Box>
        <Flex justify="between" align="baseline" mb="1">
          <Label.Root htmlFor="synonyms">Synonyms</Label.Root>
          <ConditionalAlert
            id="synonyms-error"
            message={isSubmitted ? errors.membership?.message : undefined}
          />
        </Flex>
        <Controller
          control={control}
          name="membership"
          render={({ field }) => (
            <SelectCombobox.Root
              id="synonyms"
              value={selectedOption}
              onValueChange={(opt) => {
                // Clearing leaves the trait standing on its own
                const set =
                  opt && candidates?.find((c) => c.synonymSetId === opt.id);

                field.onChange(
                  set
                    ? {
                        synonymSetId: set.synonymSetId,
                        traitId: set.headTraitId,
                        labels: set.labels,
                        hexCode: set.hexCode,
                      }
                    : null,
                );
                setSynonymQuery("");
              }}
              onQueryChange={setSynonymQuery}
              options={candidateOptions}
              loading={candidatesLoading}
              disabled={disabled || isCanonical}
            >
              <SelectCombobox.Trigger placeholder="(none)" />
              <SelectCombobox.Content behavior="input" matchTriggerWidth>
                <SelectCombobox.Input placeholder="Search traits…" />
                <SelectCombobox.List>
                  {candidateOptions.map((opt, i) => (
                    <SelectCombobox.Item
                      key={String(opt.id)}
                      option={opt}
                      index={i}
                    />
                  ))}
                </SelectCombobox.List>
              </SelectCombobox.Content>
            </SelectCombobox.Root>
          )}
        />
      </Box>

      <Box>
        <Flex justify="between" align="baseline" mb="1">
          <Label.Root htmlFor="description">Description</Label.Root>
          <Flex align="center" gap="2">
            <ConditionalAlert
              id="description-error"
              message={errors.description?.message}
            />
            {membership && (
              <SynonymDescriptionPicker
                suggestions={distinctDescriptions(members)}
                loading={membersLoading}
                onPick={(text) =>
                  setValue("description", text, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                disabled={disabled}
              />
            )}
          </Flex>
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
              suggestions={{
                title: "From synonym",
                items: distinctMedia(members),
              }}
              disabled={disabled}
            />
          )}
        />
      </Box>
    </>
  );
}

function swatch(hexCode: string | null) {
  return hexCode ? <ColorBubble hexColor={hexCode} /> : undefined;
}
