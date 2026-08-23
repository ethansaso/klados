import NiceModal from "@ebay/nice-modal-react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Dialog,
  Flex,
  Text,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Label } from "radix-ui";
import { useEffect, useMemo, useState } from "react";
import {
  Controller,
  FormProvider,
  type SubmitHandler,
  useForm,
  useWatch,
} from "react-hook-form";
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
import type { TraitValueDTO } from "../../../../../lib/domain/traits/types";
import { synonymCandidatesQueryOptions } from "../../../../../lib/queries/traits";
import { updateTraitValueFn } from "../../../../../lib/server-fns/traits/updateTraitValueFn";
import { getMediaUrl } from "../../../../../lib/storage/getMediaUrl";
import { toast } from "../../../../../lib/utils/toast";
import {
  trimmed,
  trimmedNonEmpty,
} from "../../../../../lib/validation/trimmedOptional";

interface Props {
  traitValue: TraitValueDTO;
  invalidate: () => Promise<void>;
}

type FormValues = z.infer<typeof formSchema>;
type Membership = z.infer<typeof membershipSchema>;

/** The synonym set for this trait. Nullable enforces sole membership in its set. */
const membershipSchema = z
  .object({
    synonymSetId: z.int().positive(),
    /** Any member of the set it'll belong to. */
    traitId: z.int().positive(),
    /** The set's labels, never including this trait's own. */
    labels: z.array(z.string()),
  })
  .nullable();

const formSchema = z.object({
  label: trimmedNonEmpty("Please provide a label.", {
    max: { value: 200, message: "Max 200 characters" },
  }),
  description: trimmed("Must be a string").max(1000, "Max 1000 characters"),
  hexCode: z
    .string("Must be a string")
    .trim()
    .refine((v) => v === "" || /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(v), {
      message: "Must be a valid hex color code",
    }),
  media: z.custom<MediaDTO>().nullable(),
  membership: membershipSchema,
});

/** A trait alone in its set has no synonyms, which reads as no selection. */
const seedMembership = (value: TraitValueDTO): Membership =>
  value.synonyms.length > 0
    ? {
        synonymSetId: value.synonymSetId,
        traitId: value.synonyms[0]!.id,
        labels: value.synonyms.map((s) => s.label),
      }
    : null;

const seedFormValues = (value: TraitValueDTO): FormValues => ({
  label: value.label,
  description: value.description ?? "",
  hexCode: value.hexCode ?? "",
  media: value.media,
  membership: seedMembership(value),
});

/** Maps the chosen set onto the update payload, omitting it when unchanged. */
function synonymTargetFor(
  chosen: Membership,
  original: TraitValueDTO,
): number | null | undefined {
  const wasAlone = original.synonyms.length === 0;

  if (!chosen) return wasAlone ? undefined : null;
  if (chosen.synonymSetId === original.synonymSetId) return undefined;
  return chosen.traitId;
}

const SYNONYM_CANDIDATE_LIMIT = 20;

export const EditTraitValueModal = NiceModal.create<Props>(
  ({ traitValue, invalidate }) => {
    const { visible, hide } = NiceModal.useModal();
    const serverUpdate = useServerFn(updateTraitValueFn);

    const [synonymQuery, setSynonymQuery] = useState("");

    // Hide while media modals are open
    const mediaBrowser = NiceModal.useModal(MediaBrowser);
    const wikimediaPicker = NiceModal.useModal(WikimediaPhotoSelectModal);
    const pickerOpen = mediaBrowser.visible || wikimediaPicker.visible;

    const { data: candidates, isFetching: candidatesLoading } = useQuery(
      synonymCandidatesQueryOptions(
        traitValue.id,
        synonymQuery,
        SYNONYM_CANDIDATE_LIMIT,
      ),
    );

    const methods = useForm<FormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: seedFormValues(traitValue),
    });
    const {
      control,
      formState: { isSubmitted, touchedFields, errors },
      setError,
      register,
      reset,
      setValue,
      getValues,
      handleSubmit,
    } = methods;
    const membership = useWatch({ control, name: "membership" });
    const currentMedia = useWatch({ control, name: "media" });

    /** Options keyed by set, since 'head' trait (label/id) may change, but set is selectable identity */
    const candidateOptions: ComboboxOption[] = useMemo(
      () =>
        (candidates ?? []).map((c) => ({
          id: c.synonymSetId,
          label: c.labels[0] ?? "",
          hint: c.labels.slice(1).join(", "),
        })),
      [candidates],
    );

    /** The trigger names the whole set; list items lead with the match. */
    const selectedOption: ComboboxOption | null = membership && {
      id: membership.synonymSetId,
      label: membership.labels.join(", "),
    };

    const {
      isPending: mutationPending,
      mutateAsync: mutationSubmit,
      reset: mutationReset,
    } = useMutation({
      mutationFn: serverUpdate,
      onSuccess: async (res) => {
        await invalidate();
        toast({
          variant: "success",
          description: `Trait value "${res.label}" updated successfully.`,
        });
        hide();
      },
      onError: (err) => {
        setError("root", {
          type: "server",
          message: err.message ?? "Failed to update trait value.",
        });
      },
    });

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
        onSelect: (media) => {
          setValue("media", media, { shouldDirty: true });
        },
      });

    // Metadata and membership are one payload, so one transaction commits both
    const onSubmit: SubmitHandler<FormValues> = async (data) => {
      await mutationSubmit({
        data: {
          id: traitValue.id,
          characterId: traitValue.characterId,
          label: data.label,
          description: data.description,
          hexCode: data.hexCode === "" ? null : data.hexCode,
          mediaId: data.media?.id ?? null,
          synonymTargetTraitId: synonymTargetFor(data.membership, traitValue),
        },
      });
    };

    // Reset form when opened
    useEffect(() => {
      if (!visible) return;
      reset(seedFormValues(traitValue));
      // eslint-disable-next-line @eslint-react/set-state-in-effect
      setSynonymQuery("");
      mutationReset();
    }, [visible, traitValue, reset, mutationReset]);

    return (
      <Dialog.Root
        open={visible}
        onOpenChange={(open) => {
          if (!open) {
            hide();
          }
        }}
      >
        <Dialog.Content
          maxWidth="450px"
          className="glossary-trait-dialog"
          data-picker-open={pickerOpen ? "true" : undefined}
        >
          <Dialog.Title>Edit {traitValue.label}</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Edit the details of the trait value.
          </Dialog.Description>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              {errors.root?.message ? (
                <Box mb="4">
                  <Text size="2" color="tomato">
                    {errors.root.message}
                  </Text>
                </Box>
              ) : null}
              <Flex direction="column" gap="3" mb="4">
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
                            opt &&
                            candidates?.find((c) => c.synonymSetId === opt.id);

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
                        disabled={mutationPending}
                      >
                        <SelectCombobox.Trigger placeholder="Stands on its own" />
                        <SelectCombobox.Content
                          behavior="input"
                          matchTriggerWidth
                        >
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
                    {...register("description")}
                    {...a11yProps("description-error", !!errors.description)}
                  />
                </Box>

                <Box>
                  <ClearableColorField
                    name="hexCode"
                    label="Color"
                    disabled={mutationPending}
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
                        disabled={mutationPending}
                        onClick={handleWikimediaPick}
                      >
                        Wikimedia
                      </Button>
                      <Button
                        type="button"
                        radius="full"
                        size="1"
                        disabled={mutationPending}
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
                          disabled={mutationPending}
                          onClick={() =>
                            setValue("media", null, { shouldDirty: true })
                          }
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
              </Flex>
              <Flex justify="end" gap="3">
                <Dialog.Close>
                  <Button
                    type="button"
                    disabled={mutationPending}
                    loading={mutationPending}
                    variant="soft"
                    color="gray"
                  >
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button
                  type="submit"
                  disabled={mutationPending}
                  loading={mutationPending}
                >
                  Save
                </Button>
              </Flex>
            </form>
          </FormProvider>
        </Dialog.Content>
      </Dialog.Root>
    );
  },
);
