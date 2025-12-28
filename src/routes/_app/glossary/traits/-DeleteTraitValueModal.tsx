import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { AlertDialog, Button, Flex, Text } from "@radix-ui/themes";
import { useServerFn } from "@tanstack/react-start";
import { deleteTraitValueFn } from "../../../../lib/api/traits/deleteTraitValueFn";
import { TraitValueDTO } from "../../../../lib/domain/traits/types";
import { toast } from "../../../../lib/utils/toast";

type Props = {
  value: TraitValueDTO;
  invalidate: () => Promise<void>;
};

export const DeleteTraitValueModal = NiceModal.create<Props>(
  ({ value, invalidate }) => {
    const modal = useModal();
    const serverDelete = useServerFn(deleteTraitValueFn);

    const canDelete =
      value.usageCount === 0 &&
      (value.aliasTarget ? true : (value.aliasCount ?? 0) === 0);

    const close = () => modal.hide();

    const onDelete = async () => {
      if (!canDelete) return;

      try {
        await serverDelete({ data: { id: value.id } });
        await invalidate();

        toast({
          variant: "success",
          description: `Trait value "${value.label}" deleted.`,
        });

        close();
      } catch (err) {
        toast({
          variant: "error",
          description:
            err instanceof Error
              ? err.message
              : "Failed to delete trait value.",
        });
      }
    };

    const reason =
      value.usageCount > 0
        ? `Used ${value.usageCount} time(s)`
        : !value.aliasTarget && (value.aliasCount ?? 0) > 0
          ? `Has ${value.aliasCount} alias(es)`
          : null;

    return (
      <AlertDialog.Root
        open={modal.visible}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <AlertDialog.Content>
          <AlertDialog.Title>Delete trait value</AlertDialog.Title>

          <AlertDialog.Description>
            <Flex direction="column" gap="2">
              <Text>
                Are you sure you want to delete{" "}
                <Text weight="bold">"{value.label}"</Text>? This action cannot
                be undone.
              </Text>

              {!canDelete && (
                <Text color="tomato">
                  This value cannot be deleted right now: {reason}.
                </Text>
              )}
            </Flex>
          </AlertDialog.Description>

          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray" onClick={close}>
                Cancel
              </Button>
            </AlertDialog.Cancel>

            <AlertDialog.Action>
              <Button color="tomato" disabled={!canDelete} onClick={onDelete}>
                Delete
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    );
  }
);
