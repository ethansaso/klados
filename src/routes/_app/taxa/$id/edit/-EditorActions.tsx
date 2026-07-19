import { Button, Flex } from "@radix-ui/themes";
import type { MouseEventHandler } from "react";
import { useFormContext, useFormState } from "react-hook-form";
import type { TaxonEditFormValues } from ".";

type EditorActionsProps = {
  isDraft: boolean;
  isDeleting: boolean;
  onDiscard: () => void;
  onSave: () => void;
  onPublish: () => void;
  onDelete: MouseEventHandler<HTMLButtonElement>;
};

export const EditorActions = ({
  isDraft,
  isDeleting,
  onDiscard,
  onSave,
  onPublish,
  onDelete,
}: EditorActionsProps) => {
  const { control } = useFormContext<TaxonEditFormValues>();
  const { isDirty, isSubmitting } = useFormState({ control });

  return (
    <Flex gap="2" justify="between">
      <Flex gap="2" justify="end">
        <Button
          type="button"
          disabled={isSubmitting || isDeleting || !isDirty}
          loading={isSubmitting || isDeleting}
          onClick={onDiscard}
          variant="soft"
        >
          Discard Changes
        </Button>
        <Button
          type="button"
          variant={isDraft ? "soft" : "solid"}
          loading={isSubmitting || isDeleting}
          disabled={!isDirty || isSubmitting || isDeleting}
          onClick={onSave}
        >
          Save
        </Button>
      </Flex>
      <Flex gap="2" justify="end">
        {isDraft && (
          <>
            <Button
              type="button"
              disabled={isSubmitting || isDeleting}
              loading={isSubmitting || isDeleting}
              onClick={onPublish}
            >
              Publish
            </Button>
            <Button
              type="button"
              disabled={isDeleting || isSubmitting}
              loading={isDeleting || isSubmitting}
              color="tomato"
              onClick={onDelete}
            >
              Delete Draft
            </Button>
          </>
        )}
      </Flex>
    </Flex>
  );
};
