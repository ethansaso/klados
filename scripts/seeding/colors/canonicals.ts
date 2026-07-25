/** Base hues in display order, with their HSL hue angle. */
export const BASE_HUES = [
  { name: "red", deg: 0 },
  { name: "red-orange", deg: 20 },
  { name: "orange", deg: 30 },
  { name: "yellow-orange", deg: 45 },
  { name: "yellow", deg: 60 },
  { name: "yellow-green", deg: 80 },
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
