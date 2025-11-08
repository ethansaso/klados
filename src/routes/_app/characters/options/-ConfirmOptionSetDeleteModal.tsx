import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { Button, Dialog, Flex } from "@radix-ui/themes";

type Props = {
  label: string;
  onConfirm: () => void;
};

export const ConfirmOptionSetDeleteModal = NiceModal.create<Props>(
  ({ label, onConfirm }) => {
    const { visible, hide } = useModal();
    return (
      <Dialog.Root open={visible} onOpenChange={(open) => !open && hide()}>
        <Dialog.Content maxWidth="400px" aria-describedby={undefined}>
          <Dialog.Title>Delete option set?</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Are you sure you want to delete the option set{" "}
            <strong>{label}</strong>? This action cannot be undone.
          </Dialog.Description>

          <Flex justify="end" gap="2">
            <Dialog.Close>
              <Button variant="soft">Cancel</Button>
            </Dialog.Close>
            <Button
              onClick={() => {
                onConfirm();
                hide();
              }}
            >
              Confirm
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    );
  }
);
