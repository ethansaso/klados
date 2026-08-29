import NiceModal from "@ebay/nice-modal-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Dialog, Flex, Text } from "@radix-ui/themes";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { FormProvider, type SubmitHandler, useForm } from "react-hook-form";
import { createTraitValueFn } from "../../../../../lib/server-fns/traits/createTraitValueFn";
import { toast } from "../../../../../lib/utils/toast";
import {
  TraitValueFields,
  traitValueFormSchema,
  type TraitValueFormValues,
  useMediaPickerOpen,
} from "./TraitValueFields";

interface Props {
  characterId: number;
  /** Optional label prefill. */
  initialLabel?: string;
  invalidate: () => Promise<void> | void;
}

const seedFormValues = (label: string): TraitValueFormValues => ({
  label,
  description: "",
  hexCode: "",
  media: null,
  membership: null,
});

export const AddTraitValueModal = NiceModal.create<Props>(
  ({ characterId, initialLabel = "", invalidate }) => {
    const { visible, hide } = NiceModal.useModal();
    const serverCreate = useServerFn(createTraitValueFn);
    const pickerOpen = useMediaPickerOpen();

    const methods = useForm<TraitValueFormValues>({
      resolver: zodResolver(traitValueFormSchema),
      defaultValues: seedFormValues(initialLabel),
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
      mutationFn: serverCreate,
      onSuccess: async (res) => {
        await invalidate();
        toast({
          variant: "success",
          description: `Trait value "${res.label}" created successfully.`,
        });
        hide();
      },
      onError: (err) => {
        setError("root", {
          type: "server",
          message: err.message ?? "Failed to create trait value.",
        });
      },
    });

    const onSubmit: SubmitHandler<TraitValueFormValues> = async (data) => {
      await mutationSubmit({
        data: {
          characterId,
          label: data.label,
          description: data.description,
          hexCode: data.hexCode === "" ? null : data.hexCode,
          mediaId: data.media?.id ?? null,
          synonymOfTraitId: data.membership?.traitId,
        },
      });
    };

    // Reset form when opened
    useEffect(() => {
      if (!visible) return;
      reset(seedFormValues(initialLabel));
      mutationReset();
    }, [visible, initialLabel, reset, mutationReset]);

    return (
      <Dialog.Root open={visible} onOpenChange={(open) => !open && hide()}>
        <Dialog.Content
          maxWidth="450px"
          className="glossary-trait-dialog"
          data-picker-open={pickerOpen ? "true" : undefined}
        >
          <Dialog.Title>Add trait value</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Create a new trait value for this character.
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
                  characterId={characterId}
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
                  Create
                </Button>
              </Flex>
            </form>
          </FormProvider>
        </Dialog.Content>
      </Dialog.Root>
    );
  },
);
