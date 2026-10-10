/** Undo sRGB gamma, so channels add up as light does. */
function toLinear(channel: number): number {
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

/**
 * WCAG relative luminance of a `#rgb` or `#rrggbb` color: 0 (black) to 1
 * (white), weighted for how bright each channel looks.
 */
export function relativeLuminance(hex: string): number {
  const digits = hex.replace("#", "");
  const full =
    digits.length === 3
      ? [...digits].map((digit) => digit + digit).join("")
      : digits;

  const channel = (start: number) =>
    toLinear(parseInt(full.slice(start, start + 2), 16) / 255);

  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}
