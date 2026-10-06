import z from "zod";
import type { TaxonRank } from "../../../../../db/schema/schema";
import type { ExternalCandidate } from "./types";

export const INTERNAL_RANK_TO_GBIF_MAPPING: Record<TaxonRank, string | null> = {
  kingdom: "KINGDOM",
  phylum: "PHYLUM",
  subphylum: "SUBPHYLUM",
  superclass: "SUPERCLASS",
  class: "CLASS",
  subclass: "SUBCLASS",
  infraclass: "INFRACLASS",
  superorder: "SUPERORDER",
  order: "ORDER",
  suborder: "SUBORDER",
  infraorder: "INFRAORDER",
  superfamily: "SUPERFAMILY",
  family: "FAMILY",
  subfamily: "SUBFAMILY",
  supertribe: "SUPERTRIBE",
  tribe: "TRIBE",
  subtribe: "SUBTRIBE",
  genus: "GENUS",
  subgenus: "SUBGENUS",
  section: null,
  subsection: null,
  complex: "SPECIES_AGGREGATE",
  species: "SPECIES",
  subspecies: "SUBSPECIES",
  variety: "VARIETY",
  form: "FORM",
};

const SUGGEST_LIMIT = 5;

const GbifSuggestItemSchema = z.object({
  key: z.number(),
  rank: z.string(),
  scientificName: z.string(),
  canonicalName: z.string().optional(),
  kingdom: z.string().optional(),
  phylum: z.string().optional(),
  class: z.string().optional(),
  order: z.string().optional(),
  family: z.string().optional(),
  genus: z.string().optional(),
});

/** Includes a best-effort image per match. */
export async function searchGbifCandidates(
  name: string,
  rank: TaxonRank,
  signal: AbortSignal,
): Promise<ExternalCandidate[]> {
  const url = new URL("https://api.gbif.org/v1/species/suggest");
  url.searchParams.set("q", name);
  url.searchParams.set("limit", String(SUGGEST_LIMIT));
  url.searchParams.set("status", "ACCEPTED");
  const gbifRank = INTERNAL_RANK_TO_GBIF_MAPPING[rank];
  if (gbifRank) url.searchParams.set("rank", gbifRank);

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`GBIF search failed: ${res.status}`);
  const items = z.array(GbifSuggestItemSchema).parse(await res.json());

  return Promise.all(
    items.map(async (t) => ({
      id: t.key,
      scientificName: t.scientificName,
      rank: t.rank.toLowerCase(),
      link: `https://www.gbif.org/species/${t.key}`,
      imgSrc: await fetchGbifImage(t.key, signal),
      // higherClassificationMap iterates by numeric key, not rank order
      lineage: [
        t.kingdom,
        t.phylum,
        t.class,
        t.order,
        t.family,
        t.genus,
      ].filter((n): n is string => !!n && n !== t.canonicalName),
    })),
  );
}

async function fetchGbifImage(
  taxonKey: number,
  signal: AbortSignal,
): Promise<string | undefined> {
  try {
    const url = new URL("https://api.gbif.org/v1/occurrence/search");
    url.searchParams.set("taxonKey", String(taxonKey));
    url.searchParams.set("mediaType", "StillImage");
    url.searchParams.set("limit", "1");

    const res = await fetch(url, { signal });
    if (!res.ok) return undefined;
    const first = (await res.json())?.results?.[0];
    return first?.media?.[0]?.identifier ?? first?.associatedMedia ?? undefined;
  } catch {
    return undefined;
  }
}
