import { getMediaUrl } from "../../../../lib/storage/getMediaUrl";
import { rgbToHex } from "../../../../lib/utils/color/conversion";
import type { Rgb } from "../../../../lib/utils/color/types";
import type { ColorSample } from "../types";
import { suggestPaletteColors } from "./nearestPaletteColor";

/** What the picker needs from a loaded photo. */
export type ReadablePhoto = {
  pixels: ImageData;
  /** Linear-light factor that brings the photo's bright end to full white. */
  exposure: number;
  /** Sample disc radius in image pixels. */
  radius: number;
};

/** Sample discs scale with the photo, as in the survey that tuned the matcher. */
const SAMPLE_RADIUS_FRACTION = 0.012;
const MIN_SAMPLE_RADIUS = 4;
/** Exposure is judged on a small copy; the bright end is this percentile. */
const EXPOSURE_SIZE = 200;
const BRIGHT_PERCENTILE = 0.95;
const MAX_EXPOSURE_GAIN = 1.5;

/**
 * URL for reading a photo's pixels. Remote copies get their own cache key so
 * a browser never reuses one it cached without CORS headers, which canvas
 * reads reject.
 */
export function readableMediaUrl(storageKey: string): string {
  const url = getMediaUrl(storageKey);
  return url.startsWith("http") ? `${url}?cors=1` : url;
}

/** Warms the browser cache so switching photos shows them at once. */
export function preloadPhotos(photos: { storageKey: string }[]): void {
  for (const { storageKey } of photos) {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = readableMediaUrl(storageKey);
  }
}

/** ! Throws a SecurityError when the photo's server doesn't allow reading it. */
export function readPhoto(image: HTMLImageElement): ReadablePhoto {
  const { naturalWidth: width, naturalHeight: height } = image;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0);

  return {
    pixels: ctx.getImageData(0, 0, width, height),
    exposure: exposureOf(image),
    radius: Math.max(
      MIN_SAMPLE_RADIUS,
      Math.round(SAMPLE_RADIUS_FRACTION * Math.max(width, height)),
    ),
  };
}

/** Reads the color at a spot and the palette colors it could be. */
export function samplePhoto(
  photo: ReadablePhoto,
  x: number,
  y: number,
): ColorSample {
  const rgb = sampleDisc(photo, x, y);
  return {
    sampledHex: rgbToHex(rgb),
    suggestions: suggestPaletteColors(rgb, photo.exposure),
  };
}

/** Per-channel median of the disc around a pixel, so noise and specks don't flip the read. */
export function sampleDisc(photo: ReadablePhoto, x: number, y: number): Rgb {
  const { pixels, radius } = photo;
  const channels: number[][] = [[], [], []];

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const px = x + dx;
      const py = y + dy;
      if (
        dx * dx + dy * dy > radius * radius ||
        px < 0 ||
        py < 0 ||
        px >= pixels.width ||
        py >= pixels.height
      ) {
        continue;
      }
      const offset = (py * pixels.width + px) * 4;
      for (let c = 0; c < 3; c++) channels[c]!.push(pixels.data[offset + c]!);
    }
  }

  return channels.map((values) => {
    values.sort((a, b) => a - b);
    return values[values.length >> 1]!;
  }) as Rgb;
}

/** How far to brighten so the brightest few percent reach white, capped. */
function exposureOf(image: HTMLImageElement): number {
  const scale = Math.min(
    1,
    EXPOSURE_SIZE / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const values: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    values.push(Math.max(data[i]!, data[i + 1]!, data[i + 2]!) / 255);
  }
  values.sort((a, b) => a - b);

  const bright = values[Math.floor(values.length * BRIGHT_PERCENTILE)]!;
  const gain = Math.min(
    MAX_EXPOSURE_GAIN,
    Math.max(1, 1 / Math.max(bright, 0.05)),
  );
  // The gain was fit in gamma-encoded terms
  return gain ** 2.2;
}
