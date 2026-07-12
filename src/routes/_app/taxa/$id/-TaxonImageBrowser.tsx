import { Box, Flex } from "@radix-ui/themes";
import { useState } from "react";
import { AnnotationBubbleWrap } from "../../../../components/annotations/AnnotationBubbleWrap";
import type { MediaDTO } from "../../../../lib/domain/media/types";
import { getMediaUrl } from "../../../../lib/storage/getMediaUrl";

const THUMB_HEIGHT = 48;
const THUMB_GAP = 1;
const PLACEHOLDER_SRC = "/logos/LogoDotted.svg";

export const TaxonImageBrowser = ({
  taxonName,
  media,
}: {
  taxonName: string;
  media: MediaDTO[];
}) => {
  const [selectedMediaIdx, setSelectedMediaIdx] = useState(0);
  const displayedMediaItem = media.at(selectedMediaIdx) ?? null;
  const displayedMediaSrc = displayedMediaItem
    ? getMediaUrl(displayedMediaItem.storageKey)
    : PLACEHOLDER_SRC;
  const hasMultipleMedia = media.length > 1;

  return (
    <Box
      className={`taxon-image-browser${hasMultipleMedia ? " taxon-image-browser--with-thumbnails" : ""}`}
      style={{
        ["--taxon-thumb-height" as string]: `${THUMB_HEIGHT}px`,
        ["--taxon-thumb-gap" as string]: `${THUMB_GAP}px`,
      }}
    >
      {hasMultipleMedia && displayedMediaItem && (
        <img
          className="taxon-image-browser__preview-bg"
          src={displayedMediaSrc}
          alt=""
          aria-hidden="true"
        />
      )}

      <Box className="taxon-image-browser__preview">
        {hasMultipleMedia && displayedMediaItem ? (
          <Box className="taxon-image-browser__preview-media">
            <Box className="taxon-image-browser__preview-anchor">
              <AnnotationBubbleWrap media={displayedMediaItem} spacing="2">
                <img
                  className="taxon-image-browser__preview-image taxon-image-browser__preview-image--contained"
                  src={displayedMediaSrc}
                  alt={`${taxonName}, copyright ${displayedMediaItem.owner}`}
                />
              </AnnotationBubbleWrap>
            </Box>
          </Box>
        ) : (
          <AnnotationBubbleWrap media={displayedMediaItem} spacing="2">
            <img
              className="taxon-image-browser__preview-image taxon-image-browser__preview-image--cover"
              src={displayedMediaSrc}
              alt={
                displayedMediaItem
                  ? `${taxonName}, copyright ${displayedMediaItem.owner}`
                  : `Placeholder image for ${taxonName}`
              }
            />
          </AnnotationBubbleWrap>
        )}
      </Box>

      {hasMultipleMedia && (
        <Flex className="taxon-image-browser__thumbnails" asChild>
          <ul>
            {media.map((mediaItem, idx) => (
              <li key={mediaItem.id}>
                <button
                  type="button"
                  className={
                    idx === selectedMediaIdx ? "is-selected" : undefined
                  }
                  onClick={() => setSelectedMediaIdx(idx)}
                  aria-label={`Show ${taxonName} image ${idx + 1}`}
                  aria-pressed={idx === selectedMediaIdx}
                >
                  <img
                    src={getMediaUrl(mediaItem.storageKey)}
                    alt={`${taxonName} thumbnail ${idx + 1}`}
                  />
                </button>
              </li>
            ))}
          </ul>
        </Flex>
      )}
    </Box>
  );
};
