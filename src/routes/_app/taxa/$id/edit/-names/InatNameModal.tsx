import NiceModal from "@ebay/nice-modal-react";
import { Button, Dialog, Flex, Spinner, Text } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import type { NameItem } from "../../../../../../lib/domain/taxon-names/validation";
import { inatTaxonImportQueryOptions } from "../../../../../../lib/queries/externalTaxa";

type Props = {
  inatId: number;
  onConfirm: (names: NameItem[]) => void;
};

export const InatNamesModal = NiceModal.create<Props>(
  ({ inatId, onConfirm }) => {
    const { visible, remove } = NiceModal.useModal();

    const {
      data,
      isPending: loading,
      error,
    } = useQuery(inatTaxonImportQueryOptions(inatId));
    const names = data?.names ?? null;

    const handleFinish = () => {
      if (!names) return;
      onConfirm(names);
      remove();
    };

    return (
      <Dialog.Root open={visible} onOpenChange={(open) => !open && remove()}>
        <Dialog.Content maxWidth="400px" aria-describedby={undefined}>
          <Dialog.Title>Import iNaturalist Names</Dialog.Title>
          <Flex justify="center">
            {loading ? (
              <Flex align="center" gap="2">
                <Spinner />
                <Text>Searching for common names...</Text>
              </Flex>
            ) : error ? (
              <Text color="red">{error.message}</Text>
            ) : null}
          </Flex>
          <Flex mt="5" justify="end" gap="2">
            <Button
              variant="soft"
              onClick={() => {
                remove();
              }}
            >
              Cancel
            </Button>
            <Button disabled={!names} onClick={handleFinish}>
              Confirm
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    );
  },
);

/** Simple helper which aids in acquiring common names for a given taxon. */
export async function selectInatNames(inatId: number) {
  return new Promise<NameItem[] | null>((resolve) => {
    NiceModal.show(InatNamesModal, {
      inatId,
      onConfirm: (names) => resolve(names),
    }).then(() => resolve(null));
  });
}
