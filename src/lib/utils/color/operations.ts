import { isOklchInGamut } from "./conversion";
import type { Lab } from "./types";

/** Iterations when searching for the most color a screen can show. */
const CHROMA_SEARCH_STEPS = 20;
const DEGREES = Math.PI / 180;

/** The most chroma a screen can show for an OKLCH lightness and hue. */
export function maxChroma(lightness: number, hue: number): number {
  let lo = 0;
  let hi = 0.5;
  for (let i = 0; i < CHROMA_SEARCH_STEPS; i++) {
    const mid = (lo + hi) / 2;
    if (isOklchInGamut(lightness, mid, hue)) lo = mid;
    else hi = mid;
  }
  return lo;
}

/** The OKLCH lightness at which a hue can be most colorful on screen. */
export function mostVividLightness(hue: number): number {
  let best = { lightness: 0, chroma: 0 };
  // Accumulates like the palette tuner, so results match it exactly
  for (let l = 0.3; l <= 0.99; l += 0.005) {
    const chroma = maxChroma(l, hue);
    if (chroma > best.chroma) best = { lightness: l, chroma };
  }
  return best.lightness;
}

/** Distance from neutral gray in the Lab a/b plane. */
export function labChroma([, a, b]: Lab): number {
  return Math.hypot(a, b);
}

/** CIEDE2000 color difference; smallest noticeable difference is ~1. */
export function deltaE2000([L1, a1, b1]: Lab, [L2, a2, b2]: Lab): number {
  const meanChroma7 = ((Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2) ** 7;
  const g = 0.5 * (1 - Math.sqrt(meanChroma7 / (meanChroma7 + 25 ** 7)));
  const a1p = (1 + g) * a1;
  const a2p = (1 + g) * a2;
  const C1 = Math.hypot(a1p, b1);
  const C2 = Math.hypot(a2p, b2);
  const hueAngle = (x: number, y: number) =>
    x || y ? (Math.atan2(y, x) / DEGREES + 360) % 360 : 0;
  const h1 = hueAngle(a1p, b1);
  const h2 = hueAngle(a2p, b2);
  const achromatic = C1 * C2 === 0;

  let dh = h2 - h1;
  if (achromatic) dh = 0;
  else if (dh > 180) dh -= 360;
  else if (dh < -180) dh += 360;

  const dL = L2 - L1;
  const dC = C2 - C1;
  const dH = 2 * Math.sqrt(C1 * C2) * Math.sin((dh / 2) * DEGREES);
  const meanL = (L1 + L2) / 2;
  const meanC = (C1 + C2) / 2;
  const meanH = achromatic
    ? h1 + h2
    : Math.abs(h1 - h2) <= 180
      ? (h1 + h2) / 2
      : h1 + h2 < 360
        ? (h1 + h2 + 360) / 2
        : (h1 + h2 - 360) / 2;

  const t =
    1 -
    0.17 * Math.cos((meanH - 30) * DEGREES) +
    0.24 * Math.cos(2 * meanH * DEGREES) +
    0.32 * Math.cos((3 * meanH + 6) * DEGREES) -
    0.2 * Math.cos((4 * meanH - 63) * DEGREES);
  const rC = 2 * Math.sqrt(meanC ** 7 / (meanC ** 7 + 25 ** 7));
  const rT =
    -Math.sin(60 * Math.exp(-(((meanH - 275) / 25) ** 2)) * DEGREES) * rC;
  const sL =
    1 + (0.015 * (meanL - 50) ** 2) / Math.sqrt(20 + (meanL - 50) ** 2);
  const sC = 1 + 0.045 * meanC;
  const sH = 1 + 0.015 * meanC * t;

  return Math.sqrt(
    (dL / sL) ** 2 +
      (dC / sC) ** 2 +
      (dH / sH) ** 2 +
      rT * (dC / sC) * (dH / sH),
  );
}
