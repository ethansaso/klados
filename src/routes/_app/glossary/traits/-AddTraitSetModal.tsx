import NiceModal, { useModal } from "@ebay/nice-modal-react";
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
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Form, Label } from "radix-ui";
import { SubmitHandler, useForm } from "react-hook-form";
import { useAutoKey } from "../-chrome/-useAutoKey";
import {
  a11yProps,
  ConditionalAlert,
} from "../../../../components/inputs/ConditionalAlert";
import { createTraitSetFn } from "../../../../lib/api/traits/createTraitSet";
import {
  CreateTraitSetInput,
  createTraitSetSchema,
} from "../../../../lib/domain/traits/validation";
import { toast } from "../../../../lib/utils/toast";

export const AddTraitSetModal = NiceModal.create(() => {
  const { visible, hide } = useModal();
  const qc = useQueryClient();
  const serverCreate = useServerFn(createTraitSetFn);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting, touchedFields, isSubmitted },
  } = useForm<CreateTraitSetInput>({
    resolver: zodResolver(createTraitSetSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      key: undefined,
      label: "",
      description: "",
    },
  });

  const { autoKey, setAutoKey, handleKeyBlur } = useAutoKey(
    control,
    setValue,
    "label",
    "key"
  );

  const onSubmit: SubmitHandler<CreateTraitSetInput> = async ({
    key,
    label,
    description,
  }) => {
    try {
      await serverCreate({ data: { key, label, description } });

      qc.invalidateQueries({ queryKey: ["traitSets"] });
      toast({
        variant: "success",
        description: `Trait set "${label}" created successfully.`,
      });
      reset();
      setAutoKey(true);
      hide();
    } catch (error) {
      toast({
        variant: "error",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
      });
    }
  };

  return (
    <Dialog.Root
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          reset();
          setAutoKey(true);
          hide();
        }
      }}
    >
      <Dialog.Content maxWidth="450px">
        <Dialog.Title>Add trait set</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Specify the details for the new trait set.
        </Dialog.Description>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="3" mb="4">
            <Box>
              <Flex justify="between" align="baseline" mb="1">
                <Label.Root htmlFor="trait-set-label">Label</Label.Root>
                <ConditionalAlert
                  id="trait-set-label-error"
                  message={
                    touchedFields.label || isSubmitted
                      ? errors.label?.message
                      : undefined
                  }
                />
              </Flex>
              <TextField.Root
                id="trait-set-label"
                placeholder="e.g. color, texture, odor"
                {...register("label")}
                {...a11yProps("trait-set-label-error", !!errors.label)}
              />
            </Box>
            <Box>
              <Flex justify="between" align="baseline" mb="1">
                <Label.Root htmlFor="trait-set-key">Key</Label.Root>
                <Flex align="center" gap="2">
                  <ConditionalAlert
                    id="trait-set-key-error"
                    message={
                      touchedFields.key || isSubmitted
                        ? errors.key?.message
                        : undefined
                    }
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
                id="trait-set-key"
                type="text"
                readOnly={autoKey}
                {...register("key", { onBlur: handleKeyBlur })}
                {...a11yProps("trait-set-key-error", !!errors.key)}
              />
            </Box>
            <Box>
              <Flex justify="between" align="baseline" mb="1">
                <Label.Root htmlFor="trait-set-description">
                  Description
                </Label.Root>
                <ConditionalAlert
                  id="trait-set-description-error"
                  message={
                    touchedFields.description || isSubmitted
                      ? errors.description?.message
                      : undefined
                  }
                />
              </Flex>
              <TextArea
                id="trait-set-description"
                placeholder="Optional description for this trait set"
                {...register("description")}
                {...a11yProps(
                  "trait-set-description-error",
                  !!errors.description
                )}
              />
            </Box>
          </Flex>
          <Flex justify="end" gap="3">
            <Dialog.Close>
              <Button
                type="button"
                disabled={isSubmitting}
                loading={isSubmitting}
                variant="soft"
                color="gray"
              >
                Cancel
              </Button>
            </Dialog.Close>
            <Form.Submit asChild>
              <Button
                type="submit"
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                Add trait set
              </Button>
            </Form.Submit>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
});
