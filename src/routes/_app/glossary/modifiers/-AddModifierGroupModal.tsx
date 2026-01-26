import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Dialog,
  Flex,
  Select,
  Text,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Form, Label } from "radix-ui";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import {
  a11yProps,
  ConditionalAlert,
} from "../../../../components/inputs/ConditionalAlert";
import { MODIFIER_CLASSES } from "../../../../db/schema/schema";
import { createModifierGroupFn } from "../../../../lib/api/modifiers/createModifierGroupFn";
import {
  CreateModifierGroupInput,
  createModifierGroupSchema,
} from "../../../../lib/domain/modifiers/validation";
import { useAutoKey } from "../../../../lib/hooks/useAutoKey";
import { toast } from "../../../../lib/utils/toast";

export const AddModifierGroupModal = NiceModal.create(() => {
  const { visible, hide } = useModal();
  const qc = useQueryClient();
  const serverCreate = useServerFn(createModifierGroupFn);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting, touchedFields, isSubmitted },
  } = useForm<CreateModifierGroupInput>({
    resolver: zodResolver(createModifierGroupSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      key: "",
      label: "",
      description: "",
      class: "contingent",
    },
  });

  const { autoKey, setAutoKey, handleKeyBlur } = useAutoKey(
    control,
    setValue,
    "label",
    "key",
  );

  const onSubmit: SubmitHandler<CreateModifierGroupInput> = async ({
    key,
    label,
    description,
    class: classValue,
  }) => {
    try {
      await serverCreate({
        data: {
          key,
          label,
          description,
          class: classValue,
        },
      });

      qc.invalidateQueries({ queryKey: ["modifierGroups"] });
      toast({
        variant: "success",
        description: `Modifier group "${label}" created successfully.`,
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
        <Dialog.Title>Add modifier group</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Specify the details for the new modifier group.
        </Dialog.Description>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="3" mb="4">
            <Box>
              <Flex justify="between" align="baseline" mb="1">
                <Label.Root htmlFor="modifier-group-label">Label</Label.Root>
                <ConditionalAlert
                  id="modifier-group-label-error"
                  message={
                    touchedFields.label || isSubmitted
                      ? errors.label?.message
                      : undefined
                  }
                />
              </Flex>
              <TextField.Root
                id="modifier-group-label"
                placeholder="e.g. sex, hydration, KOH reaction"
                {...register("label")}
                {...a11yProps("modifier-group-label-error", !!errors.label)}
              />
            </Box>
            <Box>
              <Flex justify="between" align="baseline" mb="1">
                <Label.Root htmlFor="modifier-group-key">Key</Label.Root>
                <Flex align="center" gap="2">
                  <ConditionalAlert
                    id="modifier-group-key-error"
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
                id="modifier-group-key"
                type="text"
                readOnly={autoKey}
                {...register("key", { onBlur: handleKeyBlur })}
                {...a11yProps("modifier-group-key-error", !!errors.key)}
              />
            </Box>
            <Box>
              <Flex justify="between" align="baseline" mb="1">
                <Label.Root htmlFor="class">Class</Label.Root>
                <ConditionalAlert
                  id="class-error"
                  message={errors.class?.message}
                />
              </Flex>
              <Controller
                name="class"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Select.Root
                    value={value}
                    onValueChange={(v) => onChange(v as typeof value)}
                  >
                    <Select.Trigger style={{ width: "100%" }}>
                      {value}
                    </Select.Trigger>
                    <Select.Content>
                      {MODIFIER_CLASSES.map((cls) => (
                        <Select.Item key={cls} value={cls}>
                          {cls}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                )}
              />
            </Box>
            <Box>
              <Flex justify="between" align="baseline" mb="1">
                <Label.Root htmlFor="modifier-group-description">
                  Description
                </Label.Root>
                <ConditionalAlert
                  id="modifier-group-description-error"
                  message={
                    touchedFields.description || isSubmitted
                      ? errors.description?.message
                      : undefined
                  }
                />
              </Flex>
              <TextArea
                id="modifier-group-description"
                placeholder="Optional description for this modifier group"
                {...register("description")}
                {...a11yProps(
                  "modifier-group-description-error",
                  !!errors.description,
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
                Add modifier group
              </Button>
            </Form.Submit>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
});
