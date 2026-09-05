import NiceModal from "@ebay/nice-modal-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Dialog, Flex, Text } from "@radix-ui/themes";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { FormProvider, type SubmitHandler, useForm } from "react-hook-form";
import { createModifierFn } from "../../../../lib/server-fns/modifiers/createModifierFn";
import { toast } from "../../../../lib/utils/toast";
import {
  ModifierFields,
  modifierFormSchema,
  type ModifierFormValues,
  useMediaPickerOpen,
} from "./-ModifierFields";

interface Props {
  groupId: number;
  initialLabel?: string;
  invalidate: () => Promise<void> | void;
}

const seedFormValues = (value: string): ModifierFormValues => ({
  label: value,
  description: "",
  affixType: "prefix",
  media: null,
});

export const AddModifierModal = NiceModal.create<Props>(
  ({ groupId, initialLabel = "", invalidate }) => {
    const { visible, hide } = NiceModal.useModal();
    const serverCreate = useServerFn(createModifierFn);
    const pickerOpen = useMediaPickerOpen();

    const methods = useForm<ModifierFormValues>({
      resolver: zodResolver(modifierFormSchema),
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
          description: `Modifier "${res.label}" created successfully.`,
        });
        hide();
      },
      onError: (err) => {
        setError("root", {
          type: "server",
          message: err.message ?? "Failed to create modifier.",
        });
      },
    });

    const onSubmit: SubmitHandler<ModifierFormValues> = async (data) => {
      await mutationSubmit({
        data: {
          groupId,
          label: data.label,
          description: data.description,
          affixType: data.affixType,
          mediaId: data.media?.id ?? null,
        },
      });
    };

    useEffect(() => {
      if (!visible) return;
      reset(seedFormValues(initialLabel));
      mutationReset();
    }, [visible, initialLabel, reset, mutationReset]);

    return (
      <Dialog.Root open={visible} onOpenChange={(open) => !open && hide()}>
        <Dialog.Content
          maxWidth="450px"
          className="glossary-modifier-dialog"
          data-picker-open={pickerOpen ? "true" : undefined}
        >
          <Dialog.Title>Add modifier</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Create a new value for this modifier group.
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
