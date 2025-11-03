import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { Box, Button, Dialog, Flex, Spinner, Text } from "@radix-ui/themes";
import * as React from "react";
import { TAXON_RANKS_DESCENDING } from "../../../../../../db/schema/schema";

type InatTaxon = {
  id: number;
  name: string;
  preferred_common_name?: string | null;
  rank?: string | null;
  default_photo?: {
    medium_url?: string | null;
    square_url?: string | null;
    original_url?: string | null;
  } | null;
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

export const InatConfirmModal = NiceModal.create<Props>(
  ({ taxonName, rank, onConfirm }) => {
    const modal = useModal();
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [taxon, setTaxon] = React.useState<InatTaxon | null>(null);

    React.useEffect(() => {
      const controller = new AbortController();

      async function fetchTaxon() {
        try {
          setLoading(true);
          setError(null);
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
            setTaxon(first);
          }
        } catch (e: any) {
          if (e.name !== "AbortError") {
            setError(e.message ?? "Failed to fetch taxon.");
          }
        } finally {
          setLoading(false);
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
        <Dialog.Content maxWidth="400px" aria-describedby={undefined}>
          <Dialog.Title align="center" mb="5">
            iNaturalist Taxon Lookup
          </Dialog.Title>

          <Flex justify="center">
            {loading ? (
              <Text>
                <Spinner />
                Searching for <strong>{taxonName}</strong>...
              </Text>
            ) : error ? (
              <Text color="red">{error}</Text>
            ) : taxon ? (
              <Flex direction="column" align="center" gap="3">
                {taxon.default_photo?.medium_url ? (
                  <Box
                    width="160px"
                    height="160px"
                    overflow="hidden"
                    style={{
                      borderRadius: 8,
                      border: "1px solid var(--gray-6)",
                      background: "var(--gray-3)",
                    }}
                  >
                    <img
                      src={taxon.default_photo.medium_url}
                      alt={taxon.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                      loading="lazy"
                    />
                  </Box>
                ) : null}

                <Box style={{ textAlign: "center" }}>
                  <Text as="div" weight="bold" size="4">
                    {taxon.name}
                  </Text>
                  {taxon.preferred_common_name ? (
                    <Text as="div" color="gray">
                      {taxon.preferred_common_name}
                    </Text>
                  ) : null}
                  {taxon.rank ? (
                    <Text as="div" color="gray" size="2">
                      Rank: {taxon.rank}
                    </Text>
                  ) : null}
                </Box>
              </Flex>
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
