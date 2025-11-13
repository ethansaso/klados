import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { Button, Dialog, Flex, Spinner, Strong, Text } from "@radix-ui/themes";
import { useLayoutEffect, useState } from "react";
import { TAXON_RANKS_DESCENDING } from "../../../../../../db/schema/schema";
import { ExternalResultSummary } from "./ExternalResultSummary";

type InatTaxon = {
  id: number;
  scientific_name: string;
  rank: string;
  common_name?: string;
  medium_src?: string;
};

type Props = {
  taxonName: string;
  rank?: string;
  onConfirm: (taxon: InatTaxon) => void;
};

const INTERNAL_RANK_TO_INAT_MAPPING: Record<
  (typeof TAXON_RANKS_DESCENDING)[number],
  string | null
> = {
  domain: null,
  kingdom: "kingdom",
  phylum: "phylum",
  class: "class",
  subclass: "subclass",
  superorder: "superorder",
  order: "order",
  family: "family",
  subfamily: "subfamily",
  tribe: "tribe",
  genus: "genus",
  species: "species",
  subspecies: "subspecies",
  variety: "variety",
};

const InatConfirmModal = NiceModal.create<Props>(
  ({ taxonName, rank, onConfirm }) => {
    const modal = useModal();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [taxon, setTaxon] = useState<InatTaxon | null>(null);

    useLayoutEffect(() => {
      const controller = new AbortController();

      async function fetchTaxon() {
        try {
          setLoading(true);
          setError(null);
          setTaxon(null);
          const url = new URL("https://api.inaturalist.org/v1/taxa");
          url.searchParams.set("q", taxonName);
          url.searchParams.set("per_page", "1");
          const iNatRank =
            INTERNAL_RANK_TO_INAT_MAPPING[
              rank as keyof typeof INTERNAL_RANK_TO_INAT_MAPPING
            ];
          if (iNatRank) url.searchParams.set("rank", iNatRank);
          const res = await fetch(url.toString(), {
            signal: controller.signal,
          });
          if (!res.ok) throw new Error(`Failed: ${res.status}`);
          const data = await res.json();
          const first = data.results?.[0];
          if (!first) {
            setError("No matching taxon found.");
          } else {
            setTaxon({
              id: first.id,
              rank: first.rank,
              scientific_name: first.name,
              common_name: first.preferred_common_name,
              medium_src: first.default_photo?.medium_url ?? null,
            });
          }
        } catch (e: any) {
          if (e.name !== "AbortError") {
            if (!controller.signal.aborted)
              setError(e.message ?? "Failed to fetch GBIF taxon.");
          }
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      }

      fetchTaxon();
      return () => controller.abort();
    }, [taxonName]);

    return (
      <Dialog.Root
        open={modal.visible}
        onOpenChange={(open) => !open && modal.hide()}
      >
        <Dialog.Content maxWidth="360px" aria-describedby={undefined}>
          <Dialog.Title align="center" mb="5">
            iNaturalist Taxon Lookup
          </Dialog.Title>

          <Flex justify="center">
            {loading ? (
              <Flex align="center" gap="2">
                <Spinner />
                <Text>
                  Searching for <Strong>{taxonName}</Strong>...
                </Text>
              </Flex>
            ) : error ? (
              <Text color="red">{error}</Text>
            ) : taxon ? (
              <ExternalResultSummary
                scientific_name={taxon.scientific_name}
                common_name={taxon.common_name}
                rank={taxon.rank}
                link={`https://www.inaturalist.org/taxa/${taxon.id}`}
                imgSrc={taxon.medium_src}
              />
            ) : null}
          </Flex>

          <Flex mt="5" justify="center" gap="2">
            <Button
              variant="soft"
              onClick={() => {
                modal.hide();
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={!taxon}
              onClick={() => {
                if (taxon) onConfirm(taxon);
                modal.hide();
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

// Helper to await a result
export async function pickInatTaxon(taxonName: string, rank?: string) {
  return new Promise<InatTaxon | null>((resolve) => {
    NiceModal.show(InatConfirmModal, {
      taxonName,
      rank,
      onConfirm: (taxon) => resolve(taxon),
    }).then(() => resolve(null)); // if closed/canceled
  });
}
