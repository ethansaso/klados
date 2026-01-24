import NiceModal from "@ebay/nice-modal-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Dialog, Flex } from "@radix-ui/themes";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  FormProvider,
  SubmitHandler,
  useForm,
  useWatch,
} from "react-hook-form";
import { createCharacterFn } from "../../../../../lib/api/characters/createCharacterFn";
import {
  CreateCharacterInput,
  createCharacterSchema,
} from "../../../../../lib/domain/characters/validation";
import { toast } from "../../../../../lib/utils/toast";
import { AddCategoricalCharacterForm } from "./AddCategoricalCharacterForm";
import { AddCharacterBaseForm } from "./AddCharacterBaseForm";
import { AddNumberCharacterForm } from "./AddNumberCharacterForm";
import { AddRangeCharacterForm } from "./AddRangeCharacterForm";

const DEFAULT_VALUES = {
  type: "categorical" as const,
  key: "",
  label: "",
  groupId: undefined,
  traitSetId: undefined,
  description: undefined,
  isMultiSelect: true,
};

export const AddCharacterModal = NiceModal.create(() => {
  const { visible, hide, remove } = NiceModal.useModal();
  const qc = useQueryClient();
  const serverCreate = useServerFn(createCharacterFn);

  const methods = useForm<CreateCharacterInput>({
    resolver: zodResolver(createCharacterSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = methods;

  // Type for discriminated rendering of form
  const type = useWatch({ control, name: "type" });

  const onSubmit: SubmitHandler<CreateCharacterInput> = async (data) => {
    try {
      await serverCreate({ data });

      qc.invalidateQueries({ queryKey: ["characters"] });
      qc.invalidateQueries({ queryKey: ["groups"] });
      qc.invalidateQueries({ queryKey: ["traitSets"] });
      qc.invalidateQueries({ queryKey: ["unitFamilies"] });

      toast({
        variant: "success",
        description: `Character "${data.label}" created successfully.`,
      });

      reset();
      remove();
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
      onOpenChange={async (open) => {
        if (!open) {
          reset();
          await hide();
        }
      }}
    >
      <Dialog.Content maxWidth="450px">
        <Dialog.Title>Add character</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Specify the details for the new character.
        </Dialog.Description>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <AddCharacterBaseForm>
              {type === "categorical" ? (
                <AddCategoricalCharacterForm />
              ) : type === "number" ? (
                <AddNumberCharacterForm />
              ) : (
                <AddRangeCharacterForm />
              )}
            </AddCharacterBaseForm>

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
              <Button
                type="submit"
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                Add character
              </Button>
            </Flex>
          </form>
        </FormProvider>
      </Dialog.Content>
    </Dialog.Root>
  );
});
