import { buildColorPalette } from "../../../../lib/domain/traits/colorPalette";
import {
  hexToRgb,
  linearToSrgb,
  rgbToLab,
  srgbToLinear,
} from "../../../../lib/utils/color/conversion";
import { deltaE2000, labChroma } from "../../../../lib/utils/color/operations";
import type { Lab, Rgb } from "../../../../lib/utils/color/types";

/** A palette color that has a swatch. */
export type PaletteSwatch = { label: string; hexCode: string };

/** Brightening factor on linear light; partially corrects dark photos. */
const LIFT = 1.15;
/** Samples this close to neutral and this light (post-exposure) read as white. */
const WHITE_MAX_CHROMA = 12;
const WHITE_MIN_LIGHTNESS = 85;
/** Looser bounds for offering white as an extra suggestion. */
const NEAR_WHITE_MAX_CHROMA = 20;
const NEAR_WHITE_MIN_LIGHTNESS = 80;
/** HSV saturation above which muted and very dark swatches are skipped. */
const VIVID_SATURATION = 0.75;
const MUTED_SHADE = /^(grayish|very dark) /;
const SUGGESTION_COUNT = 3;
const WHITE = "white";

const SWATCHES: (PaletteSwatch & { lab: Lab })[] = buildColorPalette().flatMap(
  ({ label, hexCode }) =>
    hexCode
      ? [
          {
            label,
            hexCode: hexCode.toLowerCase(),
            lab: rgbToLab(hexToRgb(hexCode)),
          },
        ]
      : [],
);

/**
 * Palette swatches ranked by how well they name a sampled photo color, best
 * first: the closest by CIEDE2000 after a brightness lift, with white promoted
 * for pale neutrals and muted swatches skipped for vivid samples.
 *
 * @param exposure Linear-light factor that brings the photo's bright end to
 * full white; only used to judge whether a pale sample is white.
 */
export function rankPaletteColors(rgb: Rgb, exposure: number): PaletteSwatch[] {
  return readSample(rgb, exposure).ranked;
}

/**
 * The top few {@link rankPaletteColors}, plus white for near-white samples
 * that miss it: a sample on the edge of something white often reads as the
 * pale band instead.
 */
export function suggestPaletteColors(
  rgb: Rgb,
  exposure: number,
): PaletteSwatch[] {
  const { ranked, nearWhite } = readSample(rgb, exposure);
  const top = ranked.slice(0, SUGGESTION_COUNT);
  const white = ranked.find((swatch) => swatch.label === WHITE);
  return nearWhite && white && !top.includes(white) ? [...top, white] : top;
}

function readSample(rgb: Rgb, exposure: number) {
  const lifted = scaleLight(rgb, LIFT);
  const lab = rgbToLab(lifted);
  const chroma = labChroma(lab);
  const exposedLightness = rgbToLab(scaleLight(lifted, exposure))[0];

  const pool =
    hsvSaturation(lifted) >= VIVID_SATURATION
      ? SWATCHES.filter((swatch) => !MUTED_SHADE.test(swatch.label))
      : SWATCHES;
  const ranked = pool
    .map((swatch) => ({ swatch, distance: deltaE2000(lab, swatch.lab) }))
    .sort((a, b) => a.distance - b.distance)
    .map(({ swatch: { label, hexCode } }) => ({ label, hexCode }));

  const isWhite =
    chroma < WHITE_MAX_CHROMA && exposedLightness >= WHITE_MIN_LIGHTNESS;
  return {
    ranked: isWhite ? promote(ranked, WHITE) : ranked,
    nearWhite:
      chroma < NEAR_WHITE_MAX_CHROMA &&
      exposedLightness >= NEAR_WHITE_MIN_LIGHTNESS,
  };
}

/** Multiplies linear light, clipping at full white, back to whole 8-bit channels. */
function scaleLight(rgb: Rgb, factor: number): Rgb {
  return rgb.map((channel) =>
    Math.round(linearToSrgb(Math.min(1, srgbToLinear(channel) * factor))),
  ) as Rgb;
}

function hsvSaturation(rgb: Rgb): number {
  const max = Math.max(...rgb);
  return max ? (max - Math.min(...rgb)) / max : 0;
}

function promote(ranked: PaletteSwatch[], label: string): PaletteSwatch[] {
  const found = ranked.find((swatch) => swatch.label === label);
  return found
    ? [found, ...ranked.filter((swatch) => swatch !== found)]
    : ranked;
}
