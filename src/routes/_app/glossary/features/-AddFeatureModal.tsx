import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Dialog,
  Flex,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Form, Label } from "radix-ui";
import { type SubmitHandler, useForm } from "react-hook-form";
import {
  a11yProps,
  ConditionalAlert,
} from "../../../../components/inputs/ConditionalAlert";
import { createFeatureFn } from "../../../../lib/api/features/createFeatureFn";
import {
  type CreateFeatureInput,
  createFeatureSchema,
} from "../../../../lib/domain/features/validation";
import { getErrorMessage } from "../../../../lib/utils/getErrorMessage";
import { toast } from "../../../../lib/utils/toast";

interface Props {
  initialLabel?: string;
}

export const AddFeatureModal = NiceModal.create(({ initialLabel }: Props) => {
  const { visible, hide } = useModal();
  const qc = useQueryClient();
  const serverCreate = useServerFn(createFeatureFn);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, touchedFields, isSubmitted },
  } = useForm<CreateFeatureInput>({
    resolver: zodResolver(createFeatureSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    values: {
      label: initialLabel ?? "",
      description: "",
    },
  });

  const onSubmit: SubmitHandler<CreateFeatureInput> = async ({
    label,
    description,
  }) => {
    try {
      await serverCreate({
        data: {
          label,
          description,
        },
      });

      qc.invalidateQueries({ queryKey: ["features"] });
      toast({
        variant: "success",
        description: `Feature "${label}" created successfully.`,
      });
      hide();
    } catch (error) {
      toast({
        variant: "error",
        description: getErrorMessage(error),
      });
    }
  };

  return (
    <Dialog.Root open={visible} onOpenChange={hide}>
      <Dialog.Content maxWidth="450px">
        <Dialog.Title>Add feature</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Specify the details for the new feature.
        </Dialog.Description>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="3" mb="4">
            <Box>
              <Flex justify="between" align="baseline" mb="1">
                <Label.Root htmlFor="feature-label">Label</Label.Root>
                <ConditionalAlert
                  id="feature-label-error"
                  message={
                    touchedFields.label || isSubmitted
                      ? errors.label?.message
                      : undefined
                  }
                />
              </Flex>
              <TextField.Root
                id="feature-label"
                placeholder="e.g. cap, stem, leaf"
                {...register("label")}
                {...a11yProps("feature-label-error", !!errors.label)}
              />
            </Box>
            <Box>
              <Flex justify="between" align="baseline" mb="1">
                <Label.Root htmlFor="feature-description">
                  Description
                </Label.Root>
                <ConditionalAlert
                  id="feature-description-error"
                  message={
                    touchedFields.description || isSubmitted
                      ? errors.description?.message
                      : undefined
                  }
                />
              </Flex>
              <TextArea
                id="feature-description"
                placeholder="Optional description for this feature"
                {...register("description")}
                {...a11yProps(
                  "feature-description-error",
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
                Add feature
              </Button>
            </Form.Submit>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
});
