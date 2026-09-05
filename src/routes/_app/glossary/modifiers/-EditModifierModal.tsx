import NiceModal from "@ebay/nice-modal-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Dialog, Flex, Text } from "@radix-ui/themes";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { FormProvider, type SubmitHandler, useForm } from "react-hook-form";
import type { ModifierDTO } from "../../../../lib/domain/modifiers/types";
import { updateModifierFn } from "../../../../lib/server-fns/modifiers/updateModifierFn";
import { toast } from "../../../../lib/utils/toast";
import {
  ModifierFields,
  modifierFormSchema,
  type ModifierFormValues,
  useMediaPickerOpen,
} from "./-ModifierFields";

interface Props {
  modifier: ModifierDTO;
  invalidate: () => Promise<void> | void;
}

export const EditModifierModal = NiceModal.create<Props>(
  ({ modifier, invalidate }) => {
    const { visible, hide } = NiceModal.useModal();
    const serverUpdate = useServerFn(updateModifierFn);
    const pickerOpen = useMediaPickerOpen();

    const methods = useForm<ModifierFormValues>({
      resolver: zodResolver(modifierFormSchema),
      defaultValues: modifier,
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
          description: `Modifier "${res.label}" updated successfully.`,
        });
        hide();
      },
      onError: (err) => {
        setError("root", {
          type: "server",
          message: err.message ?? "Failed to update modifier.",
        });
      },
    });

    const onSubmit: SubmitHandler<ModifierFormValues> = async (data) => {
      await mutationSubmit({
        data: {
          id: modifier.id,
          label: data.label,
          affixType: data.affixType,
          description: data.description,
          mediaId: data.media?.id ?? null,
        },
      });
    };

    useEffect(() => {
      if (!visible) return;
      reset(modifier);
      mutationReset();
    }, [visible, modifier, reset, mutationReset]);

    return (
      <Dialog.Root open={visible} onOpenChange={(open) => !open && hide()}>
        <Dialog.Content
          maxWidth="450px"
          className="glossary-modifier-dialog"
          data-picker-open={pickerOpen ? "true" : undefined}
        >
          <Dialog.Title>Edit {modifier.label}</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Edit the details of the modifier value.
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
                <ModifierFields disabled={mutationPending} />
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
