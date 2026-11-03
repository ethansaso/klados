import {
  maxChroma,
  mostVividLightness,
  oklchToHex,
} from "../../utils/color/oklch";

/** One palette color: its label and the hex its synonym set carries. */
export type PaletteColor = {
  label: string;
  hexCode: string | null;
};

export type BaseHue = (typeof BASE_HUES)[number];
export type Shade = (typeof SHADES)[number];

/** The character whose synonym sets are the color palette. */
export const COLOR_CHARACTER_LABEL = "Color";

/**
 * Base hues in display order: OKLCH hue angle, the lightness each hue sits at
 * naturally (yellow light, blue dark), and whether it takes a "cool" adjustment.
 */
export const BASE_HUES = [
  { name: "red", hue: 27, lightness: 0.57, cool: false },
  { name: "red-orange", hue: 42, lightness: 0.62, cool: false },
  { name: "orange", hue: 63, lightness: 0.71, cool: false },
  { name: "yellow-orange", hue: 82, lightness: 0.79, cool: false },
  { name: "yellow", hue: 103, lightness: 0.88, cool: false },
  { name: "yellow-green", hue: 122, lightness: 0.82, cool: false },
  { name: "green", hue: 145, lightness: 0.62, cool: true },
  { name: "blue-green", hue: 190, lightness: 0.66, cool: true },
  { name: "azure", hue: 235, lightness: 0.62, cool: true },
  { name: "blue", hue: 265, lightness: 0.5, cool: true },
  { name: "purple", hue: 300, lightness: 0.5, cool: true },
  { name: "magenta", hue: 335, lightness: 0.58, cool: true },
  { name: "red-purple", hue: 5, lightness: 0.57, cool: true },
] as const;

/**
 * Bands applied to every base hue, in display order. Each hue's lightness is
 * `lightness + follow * (its anchor - REFERENCE_LIGHTNESS)`, where the anchor is
 * the hue's natural lightness, or its most vivid one for `vivid` bands. Chroma
 * is scaled by `cool` for cool hues and capped at `peak` of what the screen can
 * show. `band` (0 dark to 2 light) and `muted` place the shade for similarity.
 */
export const SHADES = [
  {
    modifier: "pale",
    lightness: 0.92,
    follow: 0.1,
    chroma: 0.035,
    cool: 1,
    peak: 1,
    vivid: false,
    band: 2,
    muted: true,
  },
  {
    modifier: "light",
    lightness: 0.835,
    follow: 0.3,
    chroma: 0.08,
    cool: 0.8,
    peak: 1,
    vivid: false,
    band: 2,
    muted: false,
  },
  {
    modifier: "bright",
    lightness: 0.66,
    follow: 1,
    chroma: 0.32,
    cool: 1,
    peak: 1,
    vivid: true,
    band: 1,
    muted: false,
  },
  {
    modifier: "",
    lightness: 0.68,
    follow: 1,
    chroma: 0.19,
    cool: 0.95,
    peak: 0.85,
    vivid: false,
    band: 1,
    muted: false,
  },
  {
    modifier: "grayish",
    lightness: 0.66,
    follow: 0.35,
    chroma: 0.085,
    cool: 0.65,
    peak: 1,
    vivid: false,
    band: 1,
    muted: true,
  },
  {
    modifier: "dark",
    lightness: 0.43,
    follow: 0.35,
    chroma: 0.1,
    cool: 0.9,
    peak: 1,
    vivid: false,
    band: 0,
    muted: false,
  },
  {
    modifier: "very dark",
    lightness: 0.33,
    follow: 0.2,
    chroma: 0.05,
    cool: 0.65,
    peak: 1,
    vivid: false,
    band: 0,
    muted: true,
  },
] as const;

/** The lightness a band's `lightness` is set relative to. */
const REFERENCE_LIGHTNESS = 0.66;

/** Colors off the hue wheel, with fixed swatches. */
export const NEUTRALS = [
  { name: "white", hex: "#FFFFFF" },
  { name: "light gray", hex: "#CCCCCC" },
  { name: "gray", hex: "#888888" },
  { name: "dark gray", hex: "#444444" },
  { name: "black", hex: "#000000" },
] as const;

/** Colors with no swatch at all. */
export const SPECIAL_COLOR_NAMES = ["colorless"] as const;

const VIVID_LIGHTNESS = new Map(
  BASE_HUES.map(({ name, hue }) => [name, mostVividLightness(hue)]),
);

/**
 * Every base color in display order: the neutrals, each base hue crossed
 * with the bands, then the specials. Labels are lowercase, as everywhere
 * else in the glossary. Throws if two colors share a label.
 */
export function buildColorPalette(): PaletteColor[] {
  const neutrals = NEUTRALS.map(({ name, hex }) => ({
    label: name,
    hexCode: hex,
  }));

  const hues = BASE_HUES.flatMap((baseHue) =>
    SHADES.map((shade) => ({
      label: shadeLabel(baseHue, shade),
      hexCode: shadeHex(baseHue, shade),
    })),
  );

  const specials = SPECIAL_COLOR_NAMES.map((name) => ({
    label: name,
    hexCode: null,
  }));

  const palette = [...neutrals, ...hues, ...specials];

  const labels = new Set(palette.map((color) => color.label));
  if (labels.size !== palette.length) {
    throw new Error("Two palette colors share a label.");
  }

  return palette;
}

export function shadeLabel(baseHue: BaseHue, shade: Shade): string {
  return shade.modifier ? `${shade.modifier} ${baseHue.name}` : baseHue.name;
}

/** The swatch hex for a base hue in a band. */
export function shadeHex(baseHue: BaseHue, shade: Shade): string {
  const anchor = shade.vivid
    ? VIVID_LIGHTNESS.get(baseHue.name)!
    : baseHue.lightness;
  const lightness = Math.min(
    1,
    Math.max(
      0,
      shade.lightness + shade.follow * (anchor - REFERENCE_LIGHTNESS),
    ),
  );
  const chroma = Math.min(
    shade.chroma * (baseHue.cool ? shade.cool : 1),
    shade.peak * maxChroma(lightness, baseHue.hue),
  );
  return oklchToHex(lightness, chroma, baseHue.hue);
}
