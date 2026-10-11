import { hslToHex } from "../../utils/color/hslToHex";
import { BASE_HUES, NEUTRALS, SHADES } from "./colorPalette";

/** Where a swatch sits in the palette; `band` runs 0 (dark) to 2 (light). */
type PalettePosition =
  | { kind: "hue"; hueIndex: number; band: number; muted: boolean }
  | { kind: "neutral"; level: number };

const ADJACENT_HUE_SIMILARITY = 0.5;
/** Indexed by how many lightness bands apart two shades are. */
const BAND_GAP_SIMILARITY = [1, 0.5, 0.25];
const MUTED_MISMATCH_SIMILARITY = 0.75;
const NEUTRAL_STEP_SIMILARITY = 0.5;
const NEUTRAL_TO_MUTED_SIMILARITY = 0.5;
/** Indexed by neutral level (0 black to 4 white): the band of muted shade it resembles. */
const NEUTRAL_LEVEL_BANDS = [0, 0, 1, 2, 2];

const PALETTE_POSITIONS = buildPalettePositions();

/**
 * Similarity in [0, 1] between two palette swatches, scored by palette
 * position (hue and shade). Off-palette is a 0.
 */
export function colorSimilarity(aHex: string, bHex: string): number {
  const a = PALETTE_POSITIONS.get(aHex.toLowerCase());
  const b = PALETTE_POSITIONS.get(bHex.toLowerCase());
  if (!a || !b) return 0;
  if (a.kind === "neutral") return neutralSimilarity(a, b);
  if (b.kind === "neutral") return neutralSimilarity(b, a);

  // Wrap hues for red-purple
  const hueGap = Math.abs(a.hueIndex - b.hueIndex);
  const hueSteps = Math.min(hueGap, BASE_HUES.length - hueGap);
  if (hueSteps > 1) return 0;
  const hueSimilarity = hueSteps === 0 ? 1 : ADJACENT_HUE_SIMILARITY;

  const bandGap = Math.abs(a.band - b.band);
  const shadeSimilarity =
    bandGap === 0 && a.muted !== b.muted
      ? MUTED_MISMATCH_SIMILARITY
      : (BAND_GAP_SIMILARITY[bandGap] ?? 0);

  return hueSimilarity * shadeSimilarity;
}

function neutralSimilarity(
  neutral: Extract<PalettePosition, { kind: "neutral" }>,
  other: PalettePosition,
): number {
  if (other.kind === "hue") {
    return other.muted && other.band === NEUTRAL_LEVEL_BANDS[neutral.level]
      ? NEUTRAL_TO_MUTED_SIMILARITY
      : 0;
  }
  const steps = Math.abs(neutral.level - other.level);
  if (steps === 0) return 1;
  return steps === 1 ? NEUTRAL_STEP_SIMILARITY : 0;
}

function buildPalettePositions(): Map<string, PalettePosition> {
  const positions = new Map<string, PalettePosition>();

  // NEUTRALS run white to black
  NEUTRALS.forEach(({ hex }, i) => {
    positions.set(hex.toLowerCase(), {
      kind: "neutral",
      level: NEUTRALS.length - 1 - i,
    });
  });

  BASE_HUES.forEach(({ deg }, hueIndex) => {
    for (const { s, l } of SHADES) {
      positions.set(hslToHex(deg, s, l), {
        kind: "hue",
        hueIndex,
        band: lightnessBand(l),
        muted: s < 1,
      });
    }
  });

  return positions;
}

/** Groups pale/light, plain/grayish, and dark/dark grayish. */
function lightnessBand(l: number): number {
  if (l >= 0.75) return 2;
  return l >= 0.5 ? 1 : 0;
}
