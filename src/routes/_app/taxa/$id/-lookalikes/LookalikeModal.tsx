import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { Box, Dialog, Text } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { lookalikeDetailsQueryOptions } from "../../../../../lib/queries/lookalikes";

export const LookalikeModal = NiceModal.create<{
  taxonId: number;
  taxonAcceptedName: string;
  lookalikeId: number;
  lookalikeAcceptedName: string;
}>(({ taxonId, taxonAcceptedName, lookalikeId, lookalikeAcceptedName }) => {
  const { visible, hide } = useModal();
  const { data, isLoading, isError } = useQuery(
    lookalikeDetailsQueryOptions(taxonId, lookalikeId)
  );

  const content = useMemo(() => {
    if (isError) return <Text color="tomato">Failed</Text>;
    if (isLoading) return <Text>Loading...</Text>;
    if (!data) return <Text>No data</Text>;

    return <Box>Coming soon!</Box>;
  }, [data, isLoading, isError]);

  return (
    <Dialog.Root
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          hide();
        }
      }}
    >
      <Dialog.Content>
        <Dialog.Title>
          {taxonAcceptedName} vs. {lookalikeAcceptedName}
        </Dialog.Title>
        {content}
      </Dialog.Content>
    </Dialog.Root>
  );
});
