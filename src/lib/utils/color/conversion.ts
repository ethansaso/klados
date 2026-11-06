import type { Lab, Rgb } from "./types";

/** Iterations when clipping an OKLCH color's chroma to fit on screen. */
const CLIP_SEARCH_STEPS = 20;
const GAMUT_TOLERANCE = 1e-4;

/** `#rgb` or `#rrggbb` (any case) to sRGB channels. */
export function hexToRgb(hex: string): Rgb {
  const digits = hex.replace("#", "");
  const full =
    digits.length === 3
      ? [...digits].map((digit) => digit + digit).join("")
      : digits;
  return [0, 2, 4].map((start) =>
    parseInt(full.slice(start, start + 2), 16),
  ) as Rgb;
}

/** sRGB channels to lowercase `#rrggbb`. */
export function rgbToHex(rgb: Rgb): string {
  return `#${rgb.map((channel) => Math.round(channel).toString(16).padStart(2, "0")).join("")}`;
}

/** Undo sRGB gamma on a 0–255 channel, giving linear light from 0 to 1. */
export function srgbToLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

/** Linear light from 0 to 1 back to a 0–255 sRGB channel. */
export function linearToSrgb(linear: number): number {
  const value =
    linear <= 0.0031308 ? linear * 12.92 : 1.055 * linear ** (1 / 2.4) - 0.055;
  return value * 255;
}

export function rgbToLab(rgb: Rgb): Lab {
  const [r, g, b] = rgb.map(srgbToLinear) as Rgb;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = f((0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047);
  const y = f(0.2126729 * r + 0.7151522 * g + 0.072175 * b);
  const z = f((0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

/**
 * Hex for an OKLCH color, reducing chroma until it fits on screen.
 * * `lightness`: 0–1
 * * `hue`: degrees
 */
export function oklchToHex(
  lightness: number,
  chroma: number,
  hue: number,
): string {
  const l = Math.min(1, Math.max(0, lightness));
  let c = chroma;
  if (!isOklchInGamut(l, c, hue)) {
    let lo = 0;
    let hi = c;
    for (let i = 0; i < CLIP_SEARCH_STEPS; i++) {
      const mid = (lo + hi) / 2;
      if (isOklchInGamut(l, mid, hue)) lo = mid;
      else hi = mid;
    }
    c = lo;
  }

  return rgbToHex(
    oklchToLinearRgb(l, c, hue).map((v) =>
      Math.round(linearToSrgb(Math.min(1, Math.max(0, v)))),
    ) as Rgb,
  );
}

/** Whether an OKLCH color can be shown on an sRGB screen. */
export function isOklchInGamut(
  lightness: number,
  chroma: number,
  hue: number,
): boolean {
  return oklchToLinearRgb(lightness, chroma, hue).every(
    (v) => v >= -GAMUT_TOLERANCE && v <= 1 + GAMUT_TOLERANCE,
  );
}

function oklchToLinearRgb(
  lightness: number,
  chroma: number,
  hue: number,
): [number, number, number] {
  const a = chroma * Math.cos((hue * Math.PI) / 180);
  const b = chroma * Math.sin((hue * Math.PI) / 180);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}
