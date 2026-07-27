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
import { ClearableColorField } from "../../../../../components/inputs/ClearableColorField";
import { SelectCombobox } from "../../../../../components/inputs/combobox/SelectCombobox";
import type { ComboboxOption } from "../../../../../components/inputs/combobox/types";
import {
  a11yProps,
  ConditionalAlert,
} from "../../../../../components/inputs/ConditionalAlert";
import type { TraitValueDTO } from "../../../../../lib/domain/traits/types";
import { synonymCandidatesQueryOptions } from "../../../../../lib/queries/traits";
import { updateTraitValueFn } from "../../../../../lib/server-fns/traits/updateTraitValueFn";
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
      handleSubmit,
    } = methods;
    const membership = useWatch({ control, name: "membership" });

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

    const mutation = useMutation({
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

    // Metadata and membership are one payload, so one transaction commits both
    const onSubmit: SubmitHandler<FormValues> = async (data) => {
      await mutation.mutateAsync({
        data: {
          id: traitValue.id,
          characterId: traitValue.characterId,
          label: data.label,
          description: data.description,
          hexCode: data.hexCode === "" ? null : data.hexCode,
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
      mutation.reset();
    }, [visible, traitValue, reset]);

    return (
      <Dialog.Root
        open={visible}
        onOpenChange={(open) => {
          if (!open) {
            hide();
          }
        }}
      >
        <Dialog.Content maxWidth="450px">
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
                  <ClearableColorField
                    name="hexCode"
                    label="Color"
                    disabled={mutation.isPending}
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
                        disabled={mutation.isPending}
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
              </Flex>
              <Flex justify="end" gap="3">
                <Dialog.Close>
                  <Button
                    type="button"
                    disabled={mutation.isPending}
                    loading={mutation.isPending}
                    variant="soft"
                    color="gray"
                  >
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  loading={mutation.isPending}
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
