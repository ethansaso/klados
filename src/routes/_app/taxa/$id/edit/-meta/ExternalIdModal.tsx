import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { Button, Dialog, Flex } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { TaxonRank } from "../../../../../../../db/schema/schema";
import {
  type ExternalCandidatesQueryOptions,
  gbifCandidatesQueryOptions,
  inatCandidatesQueryOptions,
} from "../../../../../../lib/queries/externalTaxa";
import { ExternalResultSummary } from "../-ExternalResultSummary";
import type { ExternalCandidate } from "../../../-external/types";

type Props = {
  title: string;
  taxonName: string;
  rank: TaxonRank;
  candidatesQueryOptions: ExternalCandidatesQueryOptions;
  onConfirm: (taxon: ExternalCandidate) => void;
};

const ExternalIdModal = NiceModal.create<Props>(
  ({ title, taxonName, rank, candidatesQueryOptions, onConfirm }) => {
    const { visible, remove } = useModal();
    const [index, setIndex] = useState(0);

    const {
      data: candidates,
      isPending: loading,
      error: searchError,
    } = useQuery(candidatesQueryOptions(taxonName, rank));

    const error =
      searchError?.message ??
      (candidates?.length === 0 ? "No matching taxon found." : null);
    const current = candidates?.[index];

    return (
      <Dialog.Root open={visible} onOpenChange={(open) => !open && remove()}>
        <Dialog.Content maxWidth="340px" aria-describedby={undefined}>
          <Dialog.Title align="center" mb="5" size="6">
            {title}
          </Dialog.Title>

          <Flex justify="center">
            <ExternalResultSummary
              taxon={current}
              searchTitle={taxonName}
              loading={loading}
              error={error}
              index={candidates ? index : undefined}
              total={candidates?.length}
              onPrev={
                candidates
                  ? () =>
                      setIndex(
                        (i) => (i - 1 + candidates.length) % candidates.length,
                      )
                  : undefined
              }
              onNext={
                candidates
                  ? () => setIndex((i) => (i + 1) % candidates.length)
                  : undefined
              }
            />
          </Flex>

          <Flex mt="5" justify="center" gap="2">
            <Button variant="soft" onClick={() => remove()}>
              Cancel
            </Button>
            <Button
              disabled={!current}
              onClick={() => {
                if (current) onConfirm(current);
                remove();
              }}
            >
              Confirm
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    );
  },
);

export function pickGBIFTaxon(taxonName: string, rank: TaxonRank) {
  return pickExternalTaxon({
    title: "GBIF ID Lookup",
    taxonName,
    rank,
    candidatesQueryOptions: gbifCandidatesQueryOptions,
  });
}

export function pickInatTaxon(taxonName: string, rank: TaxonRank) {
  return pickExternalTaxon({
    title: "iNaturalist ID Lookup",
    taxonName,
    rank,
    candidatesQueryOptions: inatCandidatesQueryOptions,
  });
}

function pickExternalTaxon(props: Omit<Props, "onConfirm">) {
  return new Promise<ExternalCandidate | null>((resolve) => {
    NiceModal.show(ExternalIdModal, {
      ...props,
      onConfirm: (taxon) => resolve(taxon),
    }).then(() => resolve(null)); // if closed/canceled
  });
}
