import type { MediaDTO } from "../../../lib/domain/media/types";
import type { PaletteSwatch } from "./sampling/nearestPaletteColor";

/** A photo the picker can sample, with what's needed to credit it. */
export type PickerPhoto = Pick<
  MediaDTO,
  "id" | "storageKey" | "owner" | "license" | "source"
>;

/** What the color at one spot in a photo reads as. */
export type ColorSample = {
  sampledHex: string;
  suggestions: PaletteSwatch[];
};

/** One sampled spot and the color and label chosen for it. */
export type ColorPick = ColorSample & {
  id: number;
  mediaId: number;
  // Sample point in the photo's natural pixels.
  x: number;
  y: number;
  swatch: PaletteSwatch;
  /** Chosen label in the swatch's set; null means the swatch's own label. */
  traitValueId: number | null;
};
