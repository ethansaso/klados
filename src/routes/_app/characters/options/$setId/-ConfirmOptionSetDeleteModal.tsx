import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { AlertDialog, Button, Flex, Strong } from "@radix-ui/themes";

type Props = {
  label: string;
  onConfirm: () => void;
};

export const ConfirmOptionSetDeleteModal = NiceModal.create<Props>(
  ({ label, onConfirm }) => {
    const { visible, hide } = useModal();
    return (
      <AlertDialog.Root open={visible} onOpenChange={(open) => !open && hide()}>
        <AlertDialog.Content maxWidth="400px" aria-describedby={undefined}>
          <AlertDialog.Title>Delete option set</AlertDialog.Title>
          <AlertDialog.Description size="2" mb="4">
            Are you sure you want to delete the option set{" "}
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
