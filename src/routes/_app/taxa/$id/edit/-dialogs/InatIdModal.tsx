import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { Button, Dialog, Flex } from "@radix-ui/themes";
import { useLayoutEffect, useState } from "react";
import z from "zod";
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

const SUGGEST_LIMIT = 5;

const InatResultSchema = z.object({
  id: z.number(),
  rank: z.string(),
  name: z.string(),
  preferred_common_name: z.string().optional(),
  default_photo: z
    .object({
      medium_url: z.string().url(),
    })
    .optional(),
});

const InatIdModal = NiceModal.create<Props>(
  ({ taxonName, rank, onConfirm }) => {
    const modal = useModal();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [taxonResults, setTaxonResults] = useState<InatTaxon[] | null>(null);
    const [index, setIndex] = useState(0);

    useLayoutEffect(() => {
      const controller = new AbortController();

      async function fetchTaxa() {
        try {
          setLoading(true);
          setError(null);
          setTaxonResults(null);
          setIndex(0);

          const url = new URL("https://api.inaturalist.org/v1/taxa");
          url.searchParams.set("q", taxonName);
          url.searchParams.set("per_page", String(SUGGEST_LIMIT));

          const iNatRank = rank
            ? INTERNAL_RANK_TO_INAT_MAPPING[
                rank as keyof typeof INTERNAL_RANK_TO_INAT_MAPPING
              ]
            : null;
          if (iNatRank) url.searchParams.set("rank", iNatRank);

          const res = await fetch(url.toString(), {
            signal: controller.signal,
          });
          if (!res.ok) throw new Error(`Failed: ${res.status}`);

          const data = await res.json();
          let resultsRaw: unknown[] = data.results ?? [];

          if (!Array.isArray(resultsRaw) || resultsRaw.length === 0) {
            // First, attempt fallback without rank filter
            if (iNatRank) {
              url.searchParams.delete("rank");
              const resFallback = await fetch(url.toString(), {
                signal: controller.signal,
              });
              if (!resFallback.ok)
                throw new Error(`Failed: ${resFallback.status}`);

              const dataFallback = await resFallback.json();
              resultsRaw = dataFallback.results ?? [];
            }

            if (!Array.isArray(resultsRaw) || resultsRaw.length === 0) {
              setError("No matching taxon found.");
              return;
            }
          }

          const parsed = z.array(InatResultSchema).safeParse(resultsRaw);
          if (!parsed.success) {
            console.error("iNat taxon parse errors:", parsed.error);
            throw new Error("Failed to parse iNaturalist taxon data.");
          }

          const results: InatTaxon[] = parsed.data.map((t) => ({
            id: t.id,
            rank: t.rank,
            scientific_name: t.name,
            common_name: t.preferred_common_name,
            medium_src: t.default_photo?.medium_url ?? undefined,
          }));

          if (!controller.signal.aborted) {
            setTaxonResults(results);
            setIndex(0);
          }
        } catch (e: any) {
          if (e.name !== "AbortError" && !controller.signal.aborted) {
            setError(e.message ?? "Failed to fetch iNaturalist taxon.");
          }
        } finally {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        }
      }

      fetchTaxa();
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
            iNaturalist ID Lookup
          </Dialog.Title>

          <Flex justify="center">
            <ExternalResultSummary
              taxon={
                current
                  ? {
                      scientific_name: current.scientific_name,
                      common_name: current.common_name,
                      rank: current.rank,
                      link: `https://www.inaturalist.org/taxa/${current.id}`,
                      imgSrc: current.medium_src,
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
export async function pickInatTaxon(taxonName: string, rank?: string) {
  return new Promise<InatTaxon | null>((resolve) => {
    NiceModal.show(InatIdModal, {
      taxonName,
      rank,
      onConfirm: (taxon) => resolve(taxon),
    }).then(() => resolve(null)); // if closed/canceled
  });
}
