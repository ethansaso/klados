import NiceModal from "@ebay/nice-modal-react";
import {
  Box,
  Button,
  Flex,
  SegmentedControl,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import { Label } from "radix-ui";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import z from "zod";
import {
  selectWikimediaPhotos,
  WikimediaPhotoSelectModal,
} from "../-WikimediaPhotoSelectModal";
import { AFFIX_TYPES } from "../../../../../db/schema/schema";
import {
  a11yProps,
  ConditionalAlert,
} from "../../../../components/inputs/ConditionalAlert";
import MediaBrowser from "../../../../components/media-browser";
import type { MediaDTO } from "../../../../lib/domain/media/types";
import { getMediaUrl } from "../../../../lib/storage/getMediaUrl";
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

/** Signals whether to hide modal for visuals/ARIA. */
export function useMediaPickerOpen(): boolean {
  const mediaBrowser = NiceModal.useModal(MediaBrowser);
  const wikimediaPicker = NiceModal.useModal(WikimediaPhotoSelectModal);
  return mediaBrowser.visible || wikimediaPicker.visible;
}

type Props = {
  disabled?: boolean;
};

export function ModifierFields({ disabled = false }: Props) {
  const {
    control,
    register,
    setValue,
    getValues,
    formState: { errors, touchedFields, isSubmitted },
  } = useFormContext<ModifierFormValues>();

  const currentMedia = useWatch({ control, name: "media" });

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
