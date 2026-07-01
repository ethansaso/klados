import { Box, Flex } from "@radix-ui/themes";
import { useState } from "react";
import { AnnotationBubbleWrap } from "../../../../components/annotations/AnnotationBubbleWrap";
import type { MediaDTO } from "../../../../lib/domain/media/types";
import { getMediaUrl } from "../../../../lib/storage/getMediaUrl";

const THUMB_HEIGHT = 48;

export const TaxonImageBrowser = ({
  taxonName,
  media,
}: {
  taxonName: string;
  media: MediaDTO[];
}) => {
  const [selectedMediaIdx, setSelectedMediaIdx] = useState(0);
  const displayedMediaItem = media.at(selectedMediaIdx);

  return (
    <Box className="taxon-image-browser">
      <AnnotationBubbleWrap media={displayedMediaItem} spacing="2">
        <img
          src={
            displayedMediaItem
              ? getMediaUrl(displayedMediaItem.storageKey)
              : "/logos/LogoDotted.svg"
          }
          alt={
            displayedMediaItem
              ? `${taxonName}, copyright ${displayedMediaItem.owner}`
              : `Placeholder image for ${taxonName}`
          }
        />
      </AnnotationBubbleWrap>
      <Flex
        className="taxon-image-browser__thumbnails"
        style={{ overflow: "hidden" }}
        asChild
      >
        <ul>
          {media.map((mediaItem, idx) => (
            <li key={mediaItem.id}>
              <img
                src={getMediaUrl(mediaItem.storageKey)}
                alt={`${taxonName} thumbnail ${idx + 1}`}
                onClick={() => setSelectedMediaIdx(idx)}
                style={{
                  height: THUMB_HEIGHT,
                }}
              />
            </li>
          ))}
        </ul>
      </Flex>
    </Box>
  );
};
