import NiceModal from "@ebay/nice-modal-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Dialog, Flex, Text, TextField } from "@radix-ui/themes";
import { useMutation } from "@tanstack/react-query";
import { Label } from "radix-ui";
import { useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import z from "zod";
import {
  a11yProps,
  ConditionalAlert,
} from "../../../../components/inputs/ConditionalAlert";
import { updateTraitValueFn } from "../../../../lib/api/traits/updateTraitValueFn";
import { TraitValueDTO } from "../../../../lib/domain/traits/types";
import { useAutoKey } from "../../../../lib/hooks/useAutoKey";
import { toast } from "../../../../lib/utils/toast";
import {
  trimmed,
  trimmedNonEmpty,
} from "../../../../lib/validation/trimmedOptional";

interface Props {
  traitValue: TraitValueDTO;
  invalidate: () => Promise<void>;
}

const updateTraitValueFormSchema = z.object({
  key: trimmedNonEmpty("Please provide a key.", {
    max: { value: 100, message: "Max 100 characters" },
  }),
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
  aliasTargetId: z.number().int().positive().nullable(),
});
type FormValues = z.infer<typeof updateTraitValueFormSchema>;

const seedFormValues = (value: TraitValueDTO): FormValues => ({
  key: value.key,
  label: value.label,
  description: value.description ?? "",
  hexCode: value.hexCode ?? "",
  aliasTargetId: value.aliasTarget?.id ?? null,
});

// TODO: Complete rest of fields
export const EditTraitSetValueModal = NiceModal.create<Props>(
  ({ traitValue, invalidate }) => {
    const { visible, hide } = NiceModal.useModal();

    const {
      control,
      formState: { isSubmitted, touchedFields, errors },
      setValue,
      register,
      reset,
      handleSubmit,
    } = useForm<FormValues>({
      resolver: zodResolver(updateTraitValueFormSchema),
      defaultValues: seedFormValues(traitValue),
    });

    useEffect(() => {
      reset(seedFormValues(traitValue));
    }, [traitValue, reset]);

    const { autoKey, setAutoKey, handleKeyBlur } = useAutoKey(
      control,
      setValue,
      "label",
      "key"
    );

    const mutation = useMutation({
      mutationFn: updateTraitValueFn,
      onSuccess: async (res) => {
        await invalidate();
        toast({
          variant: "success",
          description: `Trait value "${res.label}" updated successfully.`,
        });
        hide();
      },
      onError: (err) => {
        toast({
          variant: "error",
          description: err.message ?? "Failed to update trait value.",
        });
      },
    });

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
      await mutation.mutateAsync({
        data: {
          id: traitValue.id,
          setId: traitValue.setId,
          key: data.key,
          label: data.label,
          description: data.description,
          hexCode: data.hexCode === "" ? null : data.hexCode,
          aliasTargetId: data.aliasTargetId,
        },
      });
    };

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
          <form onSubmit={handleSubmit(onSubmit)}>
            <Flex direction="column" gap="3" mb="4">
              <Box>
                <Flex justify="between" align="baseline" mb="1">
                  <Label.Root htmlFor="trait-value-label">Label</Label.Root>
                  <ConditionalAlert
                    id="trait-value-label-error"
                    message={
                      touchedFields.label || isSubmitted
                        ? errors.label?.message
                        : undefined
                    }
                  />
                </Flex>
                <TextField.Root
                  id="trait-value-label"
                  placeholder="e.g. cap, stem, leaf"
                  {...register("label")}
                  {...a11yProps("trait-value-label-error", !!errors.label)}
                />
              </Box>
              <Box>
                <Flex justify="between" align="baseline" mb="1">
                  <Label.Root htmlFor="trait-value-key">Key</Label.Root>
                  <Flex align="center" gap="2">
                    <ConditionalAlert
                      id="trait-value-key-error"
                      message={errors.key?.message}
                    />
                    <Text size="1" color="gray">
                      {autoKey ? "Auto" : "Manual"}
                    </Text>
                    <Button
                      size="1"
                      variant="soft"
                      type="button"
                      onClick={() => setAutoKey((v) => !v)}
                    >
                      {autoKey ? "Edit" : "Use auto"}
                    </Button>
                  </Flex>
                </Flex>
                <TextField.Root
                  id="trait-value-key"
                  type="text"
                  readOnly={autoKey}
                  {...register("key", {
                    onBlur: handleKeyBlur,
                  })}
                  {...a11yProps("trait-value-key-error", !!errors.key)}
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
        </Dialog.Content>
      </Dialog.Root>
    );
  }
);
