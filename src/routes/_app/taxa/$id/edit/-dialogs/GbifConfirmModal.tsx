//   https://api.gbif.org/v1/species/suggest?q={q}&rank={RANK}&limit=1
//   https://api.gbif.org/v1/species/{key}?language=en
//   https://api.gbif.org/v1/occurrence/search?taxonKey={key}&mediaType=StillImage&limit=1

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { Button, Dialog, Flex, Spinner, Strong, Text } from "@radix-ui/themes";
import { useLayoutEffect, useState } from "react";
import { TAXON_RANKS_DESCENDING } from "../../../../../../db/schema/schema";
import { ExternalResultSummary } from "./ExternalResultSummary";

type GbifTaxon = {
  id: number;
  rank: string;
  scientific_name: string;
  src_image?: string;
};

type Props = {
  taxonName: string;
  rank?: string;
  onConfirm: (taxon: GbifTaxon) => void;
};

const INTERNAL_RANK_TO_GBIF_MAPPING: Record<
  (typeof TAXON_RANKS_DESCENDING)[number],
  string | null
> = {
  domain: "DOMAIN",
  kingdom: "KINGDOM",
  phylum: "PHYLUM",
  class: "CLASS",
  subclass: "SUBCLASS",
  superorder: "SUPERORDER",
  order: "ORDER",
  family: "FAMILY",
  subfamily: "SUBFAMILY",
  tribe: "TRIBE",
  genus: "GENUS",
  species: "SPECIES",
  subspecies: "SUBSPECIES",
  variety: "VARIETY",
};

const GbifConfirmModal = NiceModal.create<Props>(
  ({ taxonName, rank, onConfirm }) => {
    const modal = useModal();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [taxon, setTaxon] = useState<GbifTaxon | null>(null);

    useLayoutEffect(() => {
      const controller = new AbortController();
      const run = async () => {
        try {
          setLoading(true);
          setError(null);
          setTaxon(null);

          // 1) Suggest to get ID
          const gbifRank = rank
            ? (INTERNAL_RANK_TO_GBIF_MAPPING[
                rank as keyof typeof INTERNAL_RANK_TO_GBIF_MAPPING
              ] ?? undefined)
            : undefined;

          const suggest = new URL("https://api.gbif.org/v1/species/suggest");
          suggest.searchParams.set("q", taxonName);
          suggest.searchParams.set("limit", "1");
          if (gbifRank) {
            suggest.searchParams.set("taxonRank", gbifRank);
          }

          const res = await fetch(suggest.toString(), {
            signal: controller.signal,
          });
          if (!res.ok) throw new Error(`Failed: ${res.status}`);
          const data = await res.json();
          const taxon = data?.[0];
          if (!taxon) {
            setError("No matching taxon found.");
            return;
          }

          // 2) One image from occurrences (best-effort)
          const occUrl = new URL("https://api.gbif.org/v1/occurrence/search");
          occUrl.searchParams.set("taxonKey", String(taxon.key));
          occUrl.searchParams.set("mediaType", "StillImage");
          occUrl.searchParams.set("limit", "1");

          let medium_src: string | undefined;
          try {
            const res = await fetch(occUrl.toString(), {
              signal: controller.signal,
            });
            if (!res.ok) throw new Error(`Failed: ${res.status}`);
            const data = await res.json();
            const first = data?.results?.[0];
            medium_src =
              first?.media?.[0]?.identifier ?? first?.associatedMedia ?? null;
          } catch {
            // If occurrence search fails, we still proceed without image
            medium_src = undefined;
          }

          setTaxon({
            id: taxon.key,
            rank: taxon.rank,
            scientific_name: taxon.scientificName,
            src_image: medium_src,
          });
        } catch (e: any) {
          if (e.name !== "AbortError") {
            if (!controller.signal.aborted)
              setError(e.message ?? "Failed to fetch GBIF taxon.");
          }
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      };

      run();
      return () => controller.abort();
    }, [taxonName, rank]);

    return (
      <Dialog.Root
        open={modal.visible}
        onOpenChange={(open) => !open && modal.hide()}
      >
        <Dialog.Content maxWidth="360px" aria-describedby={undefined}>
          <Dialog.Title align="center" mb="5">
            GBIF Taxon Lookup
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
                rank={taxon.rank}
                link={`https://www.gbif.org/species/${taxon.id}`}
                imgSrc={taxon.src_image}
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
export async function pickGBIFTaxon(taxonName: string, rank?: string) {
  return new Promise<GbifTaxon | null>((resolve) => {
    NiceModal.show(GbifConfirmModal, {
      taxonName,
      rank,
      onConfirm: (taxon) => resolve(taxon),
    }).then(() => resolve(null)); // if closed/canceled
  });
}
