import sharp from "sharp";
import {
  isVectorMedia,
  MEDIA_SIZE_NAMES,
  MEDIA_SIZES,
  type MediaDimensions,
  type MediaSize,
  mediaVariantKey,
  type StoredMedia,
} from "../../storage/mediaSizes";

/** One object to write to storage. */
type RenderedMediaFile = {
  key: string;
  body: Buffer;
  contentType: string;
};

/** Every stored file for one source image, plus its oriented dimensions. */
type RenderedMedia = MediaDimensions & { files: RenderedMediaFile[] };

/** Quality drop is less observable at small dimensions. */
const WEBP_QUALITY: Record<MediaSize, number> = {
  small: 80,
  medium: 80,
  large: 82,
  full: 90,
};

/**
 * Renders every stored size of a source image. Rasters become shrink-only,
 * EXIF-oriented WebPs; sharp's output defaults strip metadata and convert to
 * sRGB. Animation survives in every size but `small`. SVGs are stored as-is.
 *
 * ! Throws if sharp can't decode the input or it exceeds sharp's pixel limit.
 */
export async function renderVariants(
  source: StoredMedia & { body: Buffer },
): Promise<RenderedMedia> {
  const { body, contentType } = source;
  const { width, height } = (await sharp(body).metadata()).autoOrient;

  if (isVectorMedia(source)) {
    const key = mediaVariantKey(source, "full");
    return { width, height, files: [{ key, body, contentType }] };
  }

  // PNG diagrams / line art want near-lossless to preserve edges.
  const nearLossless = contentType === "image/png";
  const files = await Promise.all(
    MEDIA_SIZE_NAMES.map(async (size): Promise<RenderedMediaFile> => {
      const cap = MEDIA_SIZES[size];
      const rendered = await sharp(body, {
        animated: size !== "small",
        autoOrient: true,
      })
        .resize({
          width: cap,
          height: cap,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY[size], nearLossless })
        .toBuffer();

      return {
        key: mediaVariantKey(source, size),
        body: rendered,
        contentType: "image/webp",
      };
    }),
  );

  return { width, height, files };
}
