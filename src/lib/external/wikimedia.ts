import z from "zod";
import { SUPPORTED_IMAGE_TYPES } from "../storage/utils";

/**
 * Largest standard Commons thumbnail width within our `full` size. Commons
 * pregenerates only standard widths and asks clients to stick to them.
 */
export const WIKIMEDIA_IMPORT_WIDTH = 1920;

const WikimediaImportInfoResponseSchema = z.object({
  query: z
    .object({
      pages: z.record(
        z.string(),
        z.object({
          imageinfo: z
            .array(
              z.object({
                url: z.string(),
                thumburl: z.string().optional(),
                width: z.number(),
                mime: z.string(),
              }),
            )
            .optional(),
        }),
      ),
    })
    .optional(),
});

/**
 * URL to import a Commons file from.
 * 1) It's a raster format we store and already within {@link WIKIMEDIA_IMPORT_WIDTH} take original
 * 2) Otherwise, use API's thumbnail. (SVGs take the thumbnail)
 */
export async function fetchWikimediaImportUrl(
  fileTitle: string,
): Promise<string> {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url%7Csize%7Cmime&iiurlwidth=${WIKIMEDIA_IMPORT_WIDTH}&format=json&origin=*`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Wikimedia lookup failed: ${res.status}`);
  const parsed = WikimediaImportInfoResponseSchema.parse(await res.json());
  const info = Object.values(parsed.query?.pages ?? {})[0]?.imageinfo?.[0];
  if (!info) throw new Error("Wikimedia file not found.");

  const storableRaster =
    info.mime !== "image/svg+xml" &&
    (SUPPORTED_IMAGE_TYPES as readonly string[]).includes(info.mime);
  return storableRaster && info.width <= WIKIMEDIA_IMPORT_WIDTH
    ? info.url
    : (info.thumburl ?? info.url);
}
