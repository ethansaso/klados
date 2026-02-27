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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Form, Label } from "radix-ui";
import { useMemo, useState } from "react";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
import z from "zod";
import { SelectCombobox } from "../../../../components/inputs/combobox/SelectCombobox";
import type { ComboboxOption } from "../../../../components/inputs/combobox/types";
import {
  a11yProps,
  ConditionalAlert,
} from "../../../../components/inputs/ConditionalAlert";
import { createFeatureFn } from "../../../../lib/api/features/createFeatureFn";
import { createFeatureSchema } from "../../../../lib/domain/features/validation";
import { featuresQueryOptions } from "../../../../lib/queries/features";
import { getErrorMessage } from "../../../../lib/utils/getErrorMessage";
import { toast } from "../../../../lib/utils/toast";

const parentRefSchema = z.object({
  id: z.number().int().positive(),
  label: z.string().min(1),
});

const createFeatureFormSchema = createFeatureSchema
  .omit({ parentId: true })
  .extend({ parent: parentRefSchema.nullable().optional() });

type CreateFeatureFormInput = z.infer<typeof createFeatureFormSchema>;

interface Props {
  initialLabel?: string;
}

export const AddFeatureModal = NiceModal.create(({ initialLabel }: Props) => {
  const { visible, hide } = useModal();
  const qc = useQueryClient();
  const serverCreate = useServerFn(createFeatureFn);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, touchedFields, isSubmitted },
  } = useForm<CreateFeatureFormInput>({
    resolver: zodResolver(createFeatureFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    values: {
      label: initialLabel ?? "",
      description: "",
      parent: null,
    },
  });

  const [parentQuery, setParentQuery] = useState("");
  const { data: parentRes, isFetching: parentLoading } = useQuery(
    featuresQueryOptions(1, 20, { q: parentQuery }),
  );
  const parentOptions: ComboboxOption[] = useMemo(
    () =>
      (parentRes?.items ?? []).map((p) => ({
        id: p.id,
        label: p.label,
        hint: p.description ?? undefined,
      })),
    [parentRes],
  );

  const onSubmit: SubmitHandler<CreateFeatureFormInput> = async ({
    label,
    description,
    parent,
  }) => {
    try {
      await serverCreate({
        data: {
          label,
          description,
          parentId: parent ? parent.id : null,
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
                <Label.Root htmlFor="feature-parent">Parent feature</Label.Root>
              </Flex>
              <Controller
                name="parent"
                control={control}
                render={({ field }) => (
                  <SelectCombobox.Root
                    id="feature-parent"
                    value={field.value ?? null}
                    onValueChange={(opt) =>
                      field.onChange(
                        opt ? { id: Number(opt.id), label: opt.label } : null,
                      )
                    }
                    onQueryChange={setParentQuery}
                    options={parentOptions}
                    loading={parentLoading}
                    disabled={isSubmitting}
                  >
                    <SelectCombobox.Trigger placeholder="No parent" />
                    <SelectCombobox.Content behavior="input" maxWidth="400px">
                      <SelectCombobox.Input placeholder="Search features..." />
                      <SelectCombobox.List>
                        {parentOptions.map((opt, i) => (
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
