import "./MediaImage.css";

import type { ComponentPropsWithoutRef } from "react";
import { getMediaSrcSet } from "../lib/storage/getMediaSrcSet";
import { getMediaUrl } from "../lib/storage/getMediaUrl";
import {
  type MediaDimensions,
  mediaVariantKey,
  type StoredMedia,
} from "../lib/storage/mediaSizes";

type Props = Omit<
  ComponentPropsWithoutRef<"img">,
  "src" | "srcSet" | "sizes" | "width" | "height"
> & {
  media: StoredMedia & MediaDimensions;
  alt: string;
  /**
   * Rendered width, as for `<img sizes>`. Required because browsers otherwise
   * assume the full viewport width. `auto` only works with `loading="lazy"`.
   */
  sizes: string;
};

/** A stored image fetched at whichever size its layout and pixel density need. */
export function MediaImage({ media, sizes, className, ...rest }: Props) {
  return (
    <img
      sizes={sizes}
      srcSet={getMediaSrcSet(media)}
      src={getMediaUrl(mediaVariantKey(media, "medium"))}
      width={media.width}
      height={media.height}
      className={className ? `media-image ${className}` : "media-image"}
      {...rest}
    />
  );
}
