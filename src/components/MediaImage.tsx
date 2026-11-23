import "./MediaImage.css";

import { type ComponentPropsWithoutRef, useState } from "react";
import { getMediaSrcSet } from "../lib/storage/getMediaSrcSet";
import { getMediaUrl } from "../lib/storage/getMediaUrl";
import type { MediaDimensions, StoredMedia } from "../lib/storage/mediaSizes";

type Props = Omit<ComponentPropsWithoutRef<"img">, "src" | "srcSet"> & {
  media: (StoredMedia & MediaDimensions) | null | undefined;
  alt: string;
  /**
   * Rendered width, as for `<img sizes>`. Required because browsers otherwise
   * assume the full viewport width. `auto` only works with `loading="lazy"`.
   */
  sizes: string;
  /**
   * Shown when no media or file fails to load. Marked with `data-placeholder`.
   * If not passed, renders as `null`.
   */
  fallbackSrc?: string;
  /**
   * Optional width / height of the box when the image is cover-cropped (`object-fit:
   * cover`); {@link getMediaSrcSet}. When the box's shape varies, pass the
   * smallest ratio: lower is always sharp, just heavier.
   */
  coverAspect?: number;
  /**
   * Already-loaded smaller copy shown behind the image until it paints, i.e. thumbnail.
   * Only for images rendered after hydration.
   */
  placeholderSrc?: string;
};

/**
 * Image fetched from storage at whichever size its layout and pixel density need.
 * `width`/`height` default to the media's, which only reserve aspect ratio.
 */
export function MediaImage({
  media,
  sizes,
  fallbackSrc,
  coverAspect,
  placeholderSrc,
  className,
  style,
  onError,
  onLoad,
  ...rest
}: Props) {
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const classes = className ? `media-image ${className}` : "media-image";

  if (!media || failedKey === media.storageKey) {
    return fallbackSrc ? (
      <img
        src={fallbackSrc}
        data-placeholder=""
        className={classes}
        style={style}
        {...rest}
      />
    ) : null;
  }

  return (
    <img
      sizes={sizes}
      srcSet={getMediaSrcSet(media, coverAspect)}
      src={getMediaUrl(media, "medium")}
      width={media.width}
      height={media.height}
      className={classes}
      style={
        placeholderSrc
          ? {
              backgroundImage: `url("${placeholderSrc}")`,
              backgroundPosition: "center",
              backgroundSize: "cover",
              ...style,
            }
          : style
      }
      onLoad={(e) => {
        if (placeholderSrc) e.currentTarget.style.backgroundImage = "none";
        onLoad?.(e);
      }}
      onError={(e) => {
        if (fallbackSrc) setFailedKey(media.storageKey);
        onError?.(e);
      }}
      {...rest}
    />
  );
}
