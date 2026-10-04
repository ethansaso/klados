import type { TaxonRank } from "../../../../db/schema/schema";
import { capitalizeFirstLetter } from "../../utils/formatting/casing";

// ======================================================================================================
// Following other taxonomy tooling, we keep many display terms out of the backend. Conventions:
// We do not store rank markers. Correct form is Amanita muscaria guessowii.
// Sub-generic but super-species names are stored as just "Phalloideae", not "Amanita sect. Phalloideae".
// Complexes are stored as their binomial.
// ======================================================================================================

/** Acceptable word count for a properly formatted scientific name. */
export type NameShape = "uninomial" | "binomial" | "trinomial";

export const RANK_NAME_SHAPE: Record<TaxonRank, NameShape> = {
  kingdom: "uninomial",
  phylum: "uninomial",
  subphylum: "uninomial",
  superclass: "uninomial",
  class: "uninomial",
  subclass: "uninomial",
  infraclass: "uninomial",
  superorder: "uninomial",
  order: "uninomial",
  suborder: "uninomial",
  infraorder: "uninomial",
  superfamily: "uninomial",
  family: "uninomial",
  subfamily: "uninomial",
  supertribe: "uninomial",
  tribe: "uninomial",
  subtribe: "uninomial",
  genus: "uninomial",
  subgenus: "uninomial",
  section: "uninomial",
  subsection: "uninomial",
  complex: "binomial",
  species: "binomial",
  subspecies: "trinomial",
  variety: "trinomial",
  form: "trinomial",
};

/** Accepted spellings of each rank's marker; use first as the display form. */
const RANK_MARKERS: Partial<Record<TaxonRank, readonly string[]>> = {
  subgenus: ["subg.", "subgen.", "subgenus"],
  section: ["sect.", "section"],
  subsection: ["subsect.", "subsection"],
  complex: ["complex", "agg."],
  subspecies: ["ssp.", "subsp.", "subspecies"],
  variety: ["var.", "variety"],
  form: ["f.", "fo.", "forma"],
};

const SHAPE_HINT: Record<NameShape, string> = {
  uninomial: "a single capitalized word",
  binomial: '"Genus epithet" (e.g. "Amanita muscaria")',
  trinomial: '"Genus species epithet" (e.g. "Amanita muscaria guessowii")',
};

const SUBGENERIC_HINT =
  'the bare name without genus or marker (e.g. "Phalloideae")';

const WORD_COUNT: Record<NameShape, number> = {
  uninomial: 1,
  binomial: 2,
  trinomial: 3,
};

const UNINOMIAL_RE = /^[A-Z][a-z]+(?:-[a-z]+)*$/;
const EPITHET_RE = /^[a-z]+(?:-[a-z]+)*$/;

const markerKey = (token: string) => token.toLowerCase().replace(/\.$/, "");

/** Returns whether a token is a specific rank's semantic marker (e.g. "var." for variety) */
function isMarkerFor(rank: TaxonRank, token: string): boolean {
  const markers = RANK_MARKERS[rank];
  return !!markers?.some((m) => markerKey(m) === markerKey(token));
}

/** Returns whether a token is any rank's semantic marker (e.g. "var.", "sect."). */
export function isRankMarker(token: string): boolean {
  return Object.values(RANK_MARKERS).some((markers) =>
    markers.some((m) => markerKey(m) === markerKey(token)),
  );
}

export function isSubgenericRank(rank: TaxonRank): boolean {
  return rank === "subgenus" || rank === "section" || rank === "subsection";
}

function isInfraspecificRank(rank: TaxonRank): boolean {
  return RANK_NAME_SHAPE[rank] === "trinomial";
}

/** Display marker inserted before the final epithet of infraspecific names. */
export function infraspecificMarker(rank: TaxonRank): string | null {
  return isInfraspecificRank(rank) ? (RANK_MARKERS[rank]?.[0] ?? null) : null;
}

/** Whitespace-separated words of a name. */
export function sciNameWords(name: string): string[] {
  return name.split(/\s+/).filter(Boolean);
}

/**
 * Clean an accepted scientific name for storage: collapse whitespace, strip
 * rank marker (and the genus, for sub-generic ranks), and fix capitalization.
 */
export function normalizeScientificName(value: string, rank: TaxonRank): string {
  let tokens = sciNameWords(value);
  const shape = RANK_NAME_SHAPE[rank];
  const at = (i: number) => tokens.at(i) ?? "";

  if (shape === "uninomial" && tokens.length >= 2 && isMarkerFor(rank, at(-2))) {
    // "Amanita sect. Phalloideae" / "sect. Phalloideae" -> "Phalloideae"
    tokens = tokens.slice(-1);
  } else if (shape === "binomial" && tokens.length >= 3 && isMarkerFor(rank, at(-1))) {
    // "Amanita muscaria complex" -> "Amanita muscaria"
    tokens = tokens.slice(0, -1);
  } else if (shape === "trinomial" && tokens.length >= 4 && isMarkerFor(rank, at(-2))) {
    // "Amanita muscaria var. guessowii" -> "Amanita muscaria guessowii"
    tokens.splice(-2, 1);
  }

  return tokens
    .map((t, i) => (i === 0 ? capitalizeFirstLetter(t) : t.toLowerCase()))
    .join(" ");
}

/**
 * Validate a normalized accepted scientific name against its rank's shape.
 * Returns an error message, or null if valid.
 * TODO: Hybrid names ("Mentha × piperita") are not supported yet and fail here.
 */
export function validateScientificName(
  value: string,
  rank: TaxonRank,
): string | null {
  const shape = RANK_NAME_SHAPE[rank];
  const [first = "", ...epithets] = sciNameWords(value);

  const valid =
    epithets.length + 1 === WORD_COUNT[shape] &&
    UNINOMIAL_RE.test(first) &&
    epithets.every((e) => EPITHET_RE.test(e));
  if (valid) return null;

  const hint = isSubgenericRank(rank) ? SUBGENERIC_HINT : SHAPE_HINT[shape];
  return `${capitalizeFirstLetter(rank)} names must be ${hint}.`;
}
