import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { AlertDialog, Button, Flex, Strong } from "@radix-ui/themes";

type Props = {
  label: string;
  /** The type of item being deleted, e.g., "trait set" */
  itemType: string;
  onConfirm: () => void;
};

export const ConfirmDeleteModal = NiceModal.create<Props>(
  ({ label, itemType, onConfirm }) => {
    const { visible, hide } = useModal();
    return (
      <AlertDialog.Root open={visible} onOpenChange={(open) => !open && hide()}>
        <AlertDialog.Content maxWidth="400px" aria-describedby={undefined}>
          <AlertDialog.Title>Delete {itemType}</AlertDialog.Title>
          <AlertDialog.Description size="2" mb="4">
            Are you sure you want to delete the {itemType}{" "}
            <Strong>{label}</Strong>? This action cannot be undone.
          </AlertDialog.Description>

          <Flex justify="end" gap="2">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action
              onClick={() => {
                onConfirm();
                hide();
              }}
            >
              <Button color="tomato">Confirm</Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    );
  }
);
