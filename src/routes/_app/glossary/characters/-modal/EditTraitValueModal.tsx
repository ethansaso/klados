import NiceModal from "@ebay/nice-modal-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Dialog, Flex, Text } from "@radix-ui/themes";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { FormProvider, type SubmitHandler, useForm } from "react-hook-form";
import type { TraitValueDTO } from "../../../../../lib/domain/traits/types";
import { updateTraitValueFn } from "../../../../../lib/server-fns/traits/updateTraitValueFn";
import { toast } from "../../../../../lib/utils/toast";
import {
  TraitValueFields,
  traitValueFormSchema,
  type TraitValueFormValues,
  type TraitValueMembership,
  useMediaPickerOpen,
} from "./TraitValueFields";

interface Props {
  traitValue: TraitValueDTO;
  invalidate: () => Promise<void> | void;
}

/** Which traitId is largely irrelevant in this function -- just needs to target *some* trait. */
const seedMembership = (value: TraitValueDTO): TraitValueMembership =>
  value.synonyms.length > 0
    ? {
        synonymSetId: value.synonymSetId,
        traitId: value.synonyms[0]!.id,
        labels: value.synonyms.map((s) => s.label),
      }
    : null;

const seedFormValues = (value: TraitValueDTO): TraitValueFormValues => ({
  label: value.label,
  description: value.description ?? "",
  hexCode: value.hexCode ?? "",
  media: value.media,
  membership: seedMembership(value),
});

export const EditTraitValueModal = NiceModal.create<Props>(
  ({ traitValue, invalidate }) => {
    const { visible, hide } = NiceModal.useModal();
    const serverUpdate = useServerFn(updateTraitValueFn);
    const pickerOpen = useMediaPickerOpen();

    const methods = useForm<TraitValueFormValues>({
      resolver: zodResolver(traitValueFormSchema),
      defaultValues: seedFormValues(traitValue),
    });
    const {
      formState: { errors },
      setError,
      reset,
      handleSubmit,
    } = methods;

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

    const onSubmit: SubmitHandler<TraitValueFormValues> = async (data) => {
      await mutationSubmit({
        data: {
          id: traitValue.id,
          characterId: traitValue.characterId,
          label: data.label,
          description: data.description,
          hexCode: data.hexCode === "" ? null : data.hexCode,
          mediaId: data.media?.id ?? null,
          synonymOfTraitId: data.membership?.traitId ?? null,
        },
      });
    };

    // Reset form when opened
    useEffect(() => {
      if (!visible) return;
      reset(seedFormValues(traitValue));
      mutationReset();
    }, [visible, traitValue, reset, mutationReset]);

    return (
      <Dialog.Root open={visible} onOpenChange={(open) => !open && hide()}>
        <Dialog.Content
          maxWidth="450px"
          className="glossary-trait-dialog"
          data-picker-open={pickerOpen ? "true" : undefined}
        >
          <Dialog.Title>Edit trait</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Edit the details and metadata of this trait.
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
                <TraitValueFields
                  characterId={traitValue.characterId}
                  excludeTraitId={traitValue.id}
                  disabled={mutationPending}
                />
              </Flex>
              <Flex justify="end" gap="3">
                <Dialog.Close>
                  <Button
                    type="button"
                    disabled={mutationPending}
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
