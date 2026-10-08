/** One canonical color: its label and the hex its synonym set carries. */
export type PaletteColor = {
  label: string;
  hexCode: string | null;
};

/** The character whose synonym sets are the color palette. */
export const COLOR_CHARACTER_LABEL = "Color";

/** Base hues in display order, with their HSL hue angle. */
export const BASE_HUES = [
  { name: "red", deg: 0 },
  { name: "red-orange", deg: 20 },
  { name: "orange", deg: 30 },
  { name: "yellow-orange", deg: 45 },
  { name: "yellow", deg: 60 },
  { name: "yellow-green", deg: 75 },
  { name: "green", deg: 120 },
  { name: "blue-green", deg: 180 },
  { name: "blue", deg: 240 },
  { name: "purple", deg: 270 },
  { name: "red-purple", deg: 300 },
] as const;

/** Saturation/lightness ramp applied to every base hue, in display order. */
export const SHADES = [
  { modifier: "pale", s: 0.6, l: 0.85 },
  { modifier: "light", s: 1, l: 0.8 },
  { modifier: "", s: 1, l: 0.5 },
  { modifier: "grayish", s: 0.5, l: 0.5 },
  { modifier: "dark", s: 1, l: 0.25 },
  { modifier: "dark grayish", s: 0.5, l: 0.25 },
] as const;

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

/**
 * Every canonical color in display order: the neutrals, each base hue crossed
 * with the shade ramp, then the specials. Labels are lowercase, as everywhere
 * else in the glossary. Throws if two colors share a label.
 */
export function buildColorPalette(): PaletteColor[] {
  const neutrals = NEUTRALS.map(({ name, hex }) => ({
    label: name,
    hexCode: hex,
  }));

  const hues = BASE_HUES.flatMap(({ name, deg }) =>
    SHADES.map(({ modifier, s, l }) => ({
      label: modifier ? `${modifier} ${name}` : name,
      hexCode: hslToHex(deg, s, l),
    })),
  );

  const specials = SPECIAL_COLOR_NAMES.map((name) => ({
    label: name,
    hexCode: null,
  }));

  const palette = [...neutrals, ...hues, ...specials];

  const labels = new Set(palette.map((color) => color.label));
  if (labels.size !== palette.length) {
    throw new Error("Two canonical colors share a label.");
  }

  return palette;
}

/** `s` and `l` are fractions (0–1); `h` is in degrees. */
function hslToHex(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

  const toHex = (x: number) =>
    Math.round(255 * x)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}
