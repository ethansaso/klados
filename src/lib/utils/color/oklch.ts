/** Iterations when searching for the most color a screen can show. */
const CHROMA_SEARCH_STEPS = 22;
const CLIP_SEARCH_STEPS = 24;

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
  if (!inGamut(oklchToLinearRgb(l, c, hue))) {
    let lo = 0;
    let hi = c;
    for (let i = 0; i < CLIP_SEARCH_STEPS; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinearRgb(l, mid, hue))) lo = mid;
      else hi = mid;
    }
    c = lo;
  }

  return (
    "#" +
    oklchToLinearRgb(l, c, hue)
      .map((v) =>
        Math.round(255 * encodeSrgb(v))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

/** The most chroma a screen can show for this lightness and hue. */
export function maxChroma(lightness: number, hue: number): number {
  let lo = 0;
  let hi = 0.5;
  for (let i = 0; i < CHROMA_SEARCH_STEPS; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(oklchToLinearRgb(lightness, mid, hue))) lo = mid;
    else hi = mid;
  }
  return lo;
}

/** The lightness at which a hue can be most colorful on screen. */
export function mostVividLightness(hue: number): number {
  let best = { lightness: 0, chroma: 0 };
  // Accumulates like the palette tuner, so results match it exactly
  for (let l = 0.3; l <= 0.99; l += 0.005) {
    const chroma = maxChroma(l, hue);
    if (chroma > best.chroma) best = { lightness: l, chroma };
  }
  return best.lightness;
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

function inGamut(rgb: number[]): boolean {
  return rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);
}

function encodeSrgb(linear: number): number {
  const v = Math.min(1, Math.max(0, linear));
  return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
}
