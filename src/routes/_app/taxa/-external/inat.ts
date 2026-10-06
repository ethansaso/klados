import z from "zod";
import type { TaxonRank } from "../../../../../db/schema/schema";
import {
  MEDIA_LICENSES,
  type MediaLicense,
} from "../../../../../db/utils/mediaLicense";
import type { UploadMediaWireItem } from "../../../../lib/domain/media/validation";
import type { NameItem } from "../../../../lib/domain/taxon-names/validation";
import type { ExternalCandidate } from "./types";

export type InatPhoto = {
  url: string;
  license: Exclude<MediaLicense, "all-rights-reserved">;
  owner: string;
  source: string;
  name: string | undefined;
};

export type InatTaxonImport = {
  names: NameItem[];
  photos: InatPhoto[];
};

type InatRawName = z.infer<typeof InatRawNameSchema>;

export const INTERNAL_RANK_TO_INAT_MAPPING: Record<TaxonRank, string | null> = {
  kingdom: "kingdom",
  phylum: "phylum",
  subphylum: "subphylum",
  superclass: "superclass",
  class: "class",
  subclass: "subclass",
  infraclass: "infraclass",
  superorder: "superorder",
  order: "order",
  suborder: "suborder",
  infraorder: "infraorder",
  superfamily: "superfamily",
  family: "family",
  subfamily: "subfamily",
  supertribe: "supertribe",
  tribe: "tribe",
  subtribe: "subtribe",
  genus: "genus",
  subgenus: "subgenus",
  section: "section",
  subsection: "subsection",
  complex: "complex",
  species: "species",
  subspecies: "subspecies",
  variety: "variety",
  form: "form",
};

const INAT_API = "https://api.inaturalist.org/v1";
const SUGGEST_LIMIT = 5;
const MAX_PHOTOS = 9;

const ALLOWED_LICENSES = MEDIA_LICENSES.filter(
  (l) => l !== "all-rights-reserved",
) as readonly Exclude<MediaLicense, "all-rights-reserved">[];

const InatSearchResponseSchema = z.object({
  results: z.array(z.object({ id: z.number() })),
});

const InatTaxonDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  rank: z.string(),
  preferred_common_name: z.string().optional(),
  default_photo: z.object({ medium_url: z.string() }).nullable().optional(),
  ancestors: z.array(z.object({ name: z.string() })).optional(),
});

const InatTaxaDetailResponseSchema = z.object({
  results: z.array(InatTaxonDetailSchema),
});

const InatRawNameSchema = z.object({
  name: z.string(),
  locale: z.string(),
  is_valid: z.boolean().optional(),
});

// Parsed separately from photos, so a malformed one doesn't sink the other
const InatNamesResponseSchema = z.object({
  results: z
    .array(z.object({ names: z.array(InatRawNameSchema).optional() }))
    .optional(),
});

const InatPhotosResponseSchema = z.object({
  results: z.array(
    z.object({
      name: z.string().optional(),
      taxon_photos: z
        .array(
          z.object({
            photo: z.object({
              id: z.number(),
              medium_url: z.string(),
              license_code: z.string().nullable(), // iNat: null => ARR
              attribution_name: z.string().nullable(),
            }),
          }),
        )
        .optional(),
    }),
  ),
});

const AllowedLicenseSchema = z.enum(ALLOWED_LICENSES);

/** Falls back to any rank if none match. */
export async function searchInatCandidates(
  name: string,
  rank: TaxonRank,
  signal: AbortSignal,
): Promise<ExternalCandidate[]> {
  const url = new URL(`${INAT_API}/taxa`);
  url.searchParams.set("q", name);
  url.searchParams.set("per_page", String(SUGGEST_LIMIT));

  const inatRank = INTERNAL_RANK_TO_INAT_MAPPING[rank];
  if (inatRank) url.searchParams.set("rank", inatRank);

  let ids = await searchIds(url, signal);
  if (ids.length === 0 && inatRank) {
    url.searchParams.delete("rank");
    ids = await searchIds(url, signal);
  }
  if (ids.length === 0) return [];

  // Search results omit ancestor names; the by-ID endpoint has them
  const res = await fetch(`${INAT_API}/taxa/${ids.join(",")}`, { signal });
  if (!res.ok) throw new Error(`iNaturalist lookup failed: ${res.status}`);
  const { results } = InatTaxaDetailResponseSchema.parse(await res.json());
  const byId = new Map(results.map((t) => [t.id, t]));

  return ids.flatMap((id) => {
    const t = byId.get(id);
    if (!t) return [];
    return [
      {
        id: t.id,
        scientificName: t.name,
        rank: t.rank,
        link: `https://www.inaturalist.org/taxa/${t.id}`,
        commonName: t.preferred_common_name,
        imgSrc: t.default_photo?.medium_url,
        lineage: (t.ancestors ?? []).map((a) => a.name),
      },
    ];
  });
}

export async function fetchInatImport(
  inatId: number,
  signal?: AbortSignal,
): Promise<InatTaxonImport> {
  const url = new URL(`${INAT_API}/taxa/${inatId}`);
  url.searchParams.set("all_names", "true");

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`iNaturalist lookup failed: ${res.status}`);
  const data: unknown = await res.json();

  const photos = parseInatPhotos(data);
  if (!photos) {
    throw new Error(
      "Failed to parse iNaturalist response. Please contact Klados developers.",
    );
  }
  return { names: parseInatNames(data), photos };
}

export function inatPhotoToUploadItem(p: InatPhoto): UploadMediaWireItem {
  return {
    type: "url",
    url: p.url,
    license: p.license,
    owner: p.owner,
    source: p.source,
    title: p.name ?? "Unknown",
  };
}

async function searchIds(url: URL, signal: AbortSignal): Promise<number[]> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`iNaturalist search failed: ${res.status}`);
  return InatSearchResponseSchema.parse(await res.json()).results.map(
    (r) => r.id,
  );
}

function parseInatNames(data: unknown): NameItem[] {
  const parsed = InatNamesResponseSchema.safeParse(data);
  const raw = parsed.success ? (parsed.data.results?.[0]?.names ?? []) : [];
  return normalizeInatNames(raw);
}

/** Usably-licensed photos only; null if malformed. */
function parseInatPhotos(data: unknown): InatPhoto[] | null {
  const parsed = InatPhotosResponseSchema.safeParse(data);
  if (!parsed.success) return null;
  const taxon = parsed.data.results[0];

  return (taxon?.taxon_photos ?? [])
    .flatMap(({ photo: p }) => {
      const lic = AllowedLicenseSchema.safeParse(p.license_code);
      if (!lic.success) return [];
      return [
        {
          url: p.medium_url,
          license: lic.data,
          owner: p.attribution_name ?? "",
          source: `https://www.inaturalist.org/photos/${p.id}`,
          name: taxon?.name,
        } satisfies InatPhoto,
      ];
    })
    .slice(0, MAX_PHOTOS);
}

function normalizeInatNames(rawNames: InatRawName[]): NameItem[] {
  const seenLocales = new Set<string>();

  // Find preferred scientific name: first is_valid sci, else first sci.
  const preferredSci =
    rawNames.find((n) => n.locale === "sci" && n.is_valid)?.name ??
    rawNames.find((n) => n.locale === "sci")?.name ??
    null;

  return rawNames.flatMap((n) => {
    const { name, locale } = n;
    if (!name || !locale) return [];

    if (locale === "sci") {
      return [
        {
          value: name,
          locale,
          isPreferred: preferredSci === name,
        },
      ];
    }

    const isPreferred = !seenLocales.has(locale);
    seenLocales.add(locale);

    return [
      {
        value: name,
        locale,
        isPreferred,
      },
    ];
  });
}
