import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { Button, Dialog, Flex } from "@radix-ui/themes";
import { useLayoutEffect, useState } from "react";
import { ExternalResultSummary } from "../-ExternalResultSummary";
import { TAXON_RANKS_DESCENDING } from "../../../../../../db/schema/schema";

type GbifTaxon = {
  id: number;
  rank: string;
  scientificName: string;
  srcImage?: string;
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
  subgenus: "SUBGENUS",
  section: null,
  complex: "SPECIES_AGGREGATE",
  species: "SPECIES",
  subspecies: "SUBSPECIES",
  variety: "VARIETY",
};

const SUGGEST_LIMIT = 5;

const GbifIdModal = NiceModal.create<Props>(
  ({ taxonName, rank, onConfirm }) => {
    const modal = useModal();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [taxonResults, setTaxonResults] = useState<GbifTaxon[] | null>(null);
    const [index, setIndex] = useState(0);

    useLayoutEffect(() => {
      const controller = new AbortController();

      const run = async () => {
        try {
          setLoading(true);
          setError(null);
          setTaxonResults(null);
          setIndex(0);

          const gbifRank = rank
            ? (INTERNAL_RANK_TO_GBIF_MAPPING[
                rank as keyof typeof INTERNAL_RANK_TO_GBIF_MAPPING
              ] ?? undefined)
            : undefined;

          // Get candidates from 'suggest' API endpoint
          const suggest = new URL("https://api.gbif.org/v1/species/suggest");
          suggest.searchParams.set("q", taxonName);
          suggest.searchParams.set("limit", String(SUGGEST_LIMIT));
          suggest.searchParams.set("status", "ACCEPTED");
          if (gbifRank) {
            suggest.searchParams.set("rank", gbifRank);
          }

          const res = await fetch(suggest.toString(), {
            signal: controller.signal,
          });
          if (!res.ok) throw new Error(`Failed: ${res.status}`);

          const data: any[] = await res.json();
          if (!Array.isArray(data) || data.length === 0) {
            setError("No matching taxon found.");
            return;
          }

          // Best-effort attempt at getting an image for each taxon
          const results: GbifTaxon[] = await Promise.all(
            data.map(async (taxon) => {
              let mediumSrc: string | undefined;

              try {
                const occ = new URL(
                  "https://api.gbif.org/v1/occurrence/search"
                );
                occ.searchParams.set("taxonKey", String(taxon.key));
                occ.searchParams.set("mediaType", "StillImage");
                occ.searchParams.set("limit", "1");

                const occRes = await fetch(occ.toString(), {
                  signal: controller.signal,
                });
                if (!occRes.ok) throw new Error(`Failed: ${occRes.status}`);

                const occJson = await occRes.json();
                const first = occJson?.results?.[0];
                mediumSrc =
                  first?.media?.[0]?.identifier ??
                  first?.associatedMedia ??
                  undefined;
              } catch {
                mediumSrc = undefined;
              }

              return {
                id: taxon.key,
                rank: taxon.rank,
                scientificName: taxon.scientificName,
                srcImage: mediumSrc,
              } satisfies GbifTaxon;
            })
          );

          if (!controller.signal.aborted) {
            setTaxonResults(results);
            setIndex(0);
          }
        } catch (e: any) {
          if (e.name !== "AbortError" && !controller.signal.aborted) {
            setError(e.message ?? "Failed to fetch GBIF taxon.");
          }
        } finally {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        }
      };

      run();
      return () => controller.abort();
    }, [taxonName, rank]);

    const current = taxonResults?.[index];

    return (
      <Dialog.Root
        open={modal.visible}
        onOpenChange={(open) => !open && modal.hide()}
      >
        <Dialog.Content maxWidth="340px" aria-describedby={undefined}>
          <Dialog.Title align="center" mb="5" size="6">
            GBIF ID Lookup
          </Dialog.Title>

          <Flex justify="center">
            <ExternalResultSummary
              taxon={
                current
                  ? {
                      scientificName: current.scientificName,
                      rank: current.rank.toLowerCase(),
                      link: `https://www.gbif.org/species/${current.id}`,
                      imgSrc: current.srcImage,
                    }
                  : undefined
              }
              searchTitle={taxonName}
              loading={loading}
              error={error}
              index={taxonResults ? index : undefined}
              total={taxonResults ? taxonResults.length : undefined}
              onPrev={
                taxonResults
                  ? () =>
                      setIndex(
                        (i) =>
                          (i - 1 + taxonResults.length) % taxonResults.length
                      )
                  : undefined
              }
              onNext={
                taxonResults
                  ? () => setIndex((i) => (i + 1) % taxonResults.length)
                  : undefined
              }
            />
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
              disabled={!current}
              onClick={() => {
                if (current) onConfirm(current);
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
    NiceModal.show(GbifIdModal, {
      taxonName,
      rank,
      onConfirm: (taxon) => resolve(taxon),
    }).then(() => resolve(null)); // if closed/canceled
  });
}
