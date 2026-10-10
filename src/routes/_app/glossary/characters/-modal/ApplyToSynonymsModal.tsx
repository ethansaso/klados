import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { Button, Dialog, Flex, Strong, Text } from "@radix-ui/themes";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SynonymApplyReview } from "../-components/SynonymApplyReview";
import { useSynonymApply } from "../-hooks/useSynonymApply";
import type { TraitValueDTO } from "../../../../../lib/domain/traits/types";
import { updateTraitValuesFn } from "../../../../../lib/server-fns/traits/updateTraitValuesFn";
import { toast } from "../../../../../lib/utils/toast";

type Props = {
  traitValue: TraitValueDTO;
  invalidate: () => Promise<void> | void;
};

/** Copies a saved trait's description and image onto chosen synonyms. */
export const ApplyToSynonymsModal = NiceModal.create<Props>(
  ({ traitValue, invalidate }) => {
    const modal = useModal();
    const serverUpdate = useServerFn(updateTraitValuesFn);
    const apply = useSynonymApply(traitValue);
    const count = apply.patches.length;

    const { isPending, mutate, error } = useMutation({
      mutationFn: serverUpdate,
      onSuccess: async (updated) => {
        await invalidate();
        const n = updated.length;
        toast({
          variant: "success",
          description: `Updated ${n} synonym${n === 1 ? "" : "s"} of "${traitValue.label}".`,
        });
        modal.remove();
      },
    });

    const onApply = () => mutate({ data: { items: apply.patches } });

    return (
      <Dialog.Root
        open={modal.visible}
        onOpenChange={(open) => !open && modal.remove()}
      >
        <Dialog.Content maxWidth="450px">
          <Dialog.Title>Apply to synonyms</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Choose which synonyms to update from{" "}
            <Strong>{traitValue.label}</Strong>.
          </Dialog.Description>
          {error && (
            <Text as="p" size="2" color="tomato" mb="3">
              {error.message || "Failed to apply to synonyms."}
            </Text>
          )}
          <SynonymApplyReview
            source={traitValue}
            apply={apply}
            disabled={isPending}
          />
          <Flex justify="end" gap="3" mt="4">
            <Dialog.Close>
              <Button
                type="button"
                variant="soft"
                color="gray"
                disabled={isPending}
              >
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              type="button"
              disabled={!count || apply.isLoading}
              loading={isPending}
              onClick={onApply}
            >
              {count ? `Apply to ${count}` : "Apply"}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    );
  },
);
