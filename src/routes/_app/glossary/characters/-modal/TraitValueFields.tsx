import NiceModal from "@ebay/nice-modal-react";
import { Box, Button, Flex, TextArea, TextField } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { Label } from "radix-ui";
import { useMemo, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import z from "zod";
import {
  selectWikimediaPhotos,
  WikimediaPhotoSelectModal,
} from "../../-WikimediaPhotoSelectModal";
import { ClearableColorField } from "../../../../../components/inputs/ClearableColorField";
import { SelectCombobox } from "../../../../../components/inputs/combobox/SelectCombobox";
import type { ComboboxOption } from "../../../../../components/inputs/combobox/types";
import {
  a11yProps,
  ConditionalAlert,
} from "../../../../../components/inputs/ConditionalAlert";
import MediaBrowser from "../../../../../components/media-browser";
import type { MediaDTO } from "../../../../../lib/domain/media/types";
import { synonymCandidatesQueryOptions } from "../../../../../lib/queries/traits";
import { getMediaUrl } from "../../../../../lib/storage/getMediaUrl";
import {
  trimmed,
  trimmedNonEmpty,
} from "../../../../../lib/validation/trimmedOptional";

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
  })
  .nullable();

export const traitValueFormSchema = z.object({
  label: trimmedNonEmpty("Please provide a label.", {
    max: { value: 200, message: "Max 200 characters" },
  }),
  description: trimmed("Must be a string").max(1000, "Max 1000 characters"),
  hexCode: trimmed("Must be a string").refine(
    (v) => v === "" || /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(v),
    {
      message: "Must be a valid hex color code",
    },
  ),
  media: z.custom<MediaDTO>().nullable(),
  membership: membershipSchema,
});

/** Signals whether to hide modal for visuals/ARIA. */
export function useMediaPickerOpen(): boolean {
  const mediaBrowser = NiceModal.useModal(MediaBrowser);
  const wikimediaPicker = NiceModal.useModal(WikimediaPhotoSelectModal);
  return mediaBrowser.visible || wikimediaPicker.visible;
}

type Props = {
  characterId: number;
  /** Keeps trait from appearing in own synonyms list (i.e. for editing extant trait) */
  excludeTraitId?: number;
  disabled?: boolean;
};

export function TraitValueFields({
  characterId,
  excludeTraitId,
  disabled = false,
}: Props) {
  const {
    control,
    register,
    setValue,
    getValues,
    formState: { errors, touchedFields, isSubmitted },
  } = useFormContext<TraitValueFormValues>();

  const [synonymQuery, setSynonymQuery] = useState("");
  const currentMedia = useWatch({ control, name: "media" });
  const membership = useWatch({ control, name: "membership" });

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
      })),
    [candidates],
  );

  /** Trigger references a single synonym for payload, but labels w/ all synonyms. */
  const selectedOption: ComboboxOption | null = membership && {
    id: membership.synonymSetId,
    label: membership.labels.join(", "),
  };

  /** Wikimedia seeds its search with the label as currently edited. */
  const handleWikimediaPick = async () => {
    const picked = await selectWikimediaPhotos(getValues("label"));
    const media = picked?.[0];
    if (!media) return;

    setValue("media", media, { shouldDirty: true });
  };

  const handleBrowserPick = () =>
    NiceModal.show(MediaBrowser, {
      mode: "single",
      onSelect: (media: MediaDTO) => {
        setValue("media", media, { shouldDirty: true });
      },
    });

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
          {...register("label")}
          {...a11yProps("label-error", !!errors.label)}
        />
      </Box>

      <Box>
        <Box mb="1">
          <Label.Root htmlFor="synonyms">Synonyms</Label.Root>
        </Box>
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
                      }
                    : null,
                );
                setSynonymQuery("");
              }}
              onQueryChange={setSynonymQuery}
              options={candidateOptions}
              loading={candidatesLoading}
              disabled={disabled}
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
        <ClearableColorField name="hexCode" label="Color" disabled={disabled} />
      </Box>

      <Box>
        <Flex justify="between" align="baseline" mb="1">
          <Label.Root>Media</Label.Root>
          <Flex gap="2">
            <Button
              type="button"
              radius="full"
              size="1"
              color="cyan"
              disabled={disabled}
              onClick={handleWikimediaPick}
            >
              Wikimedia
            </Button>
            <Button
              type="button"
              radius="full"
              size="1"
              disabled={disabled}
              onClick={handleBrowserPick}
            >
              Browser
            </Button>
            {currentMedia && (
              <Button
                type="button"
                radius="full"
                size="1"
                color="tomato"
                disabled={disabled}
                onClick={() => setValue("media", null, { shouldDirty: true })}
              >
                Remove
              </Button>
            )}
          </Flex>
        </Flex>
        {currentMedia && (
          <img
            src={getMediaUrl(currentMedia.storageKey)}
            alt={currentMedia.title}
            style={{
              width: "96px",
              height: "96px",
              objectFit: "cover",
              borderRadius: "var(--radius-2)",
            }}
          />
        )}
      </Box>
    </>
  );
}
