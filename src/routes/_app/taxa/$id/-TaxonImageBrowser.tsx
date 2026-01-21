import { Box, Flex } from "@radix-ui/themes";
import { useState } from "react";
import { AnnotationBubbleWrap } from "../../../../components/annotations/AnnotationBubbleWrap";
import { MediaItem } from "../../../../lib/domain/taxa/validation";

const THUMB_SIZE = 48;

// TODO: Scrolling thumbnails if too many to fit
export const TaxonImageBrowser = ({
  taxonName,
  media,
}: {
  taxonName: string;
  media: MediaItem[];
}) => {
  const [selectedMediaIdx, setSelectedMediaIdx] = useState(0);
  const displayedMediaItem = media[selectedMediaIdx];

  return (
    <Box className="taxon-image-browser">
      <AnnotationBubbleWrap media={displayedMediaItem} spacing="2">
        <img
          src={displayedMediaItem?.url ?? "/logos/LogoDotted.svg"}
          alt={`${taxonName}, copyright ${displayedMediaItem.owner}`}
          style={{
            display: "block",
            aspectRatio: "1/1",
            objectPosition: "center",
            objectFit: "cover",
            overflow: "hidden",
          }}
        />
      </AnnotationBubbleWrap>
      <Flex
        className="taxon-image-browser__thumbnails"
        style={{ overflow: "hidden" }}
        asChild
      >
        <ul>
          {media.map((mediaItem, idx) => (
            <li key={mediaItem.url}>
              <img
                src={mediaItem.url}
                alt={`${taxonName} thumbnail ${idx + 1}`}
                onClick={() => setSelectedMediaIdx(idx)}
                style={{
                  height: THUMB_SIZE,
                  aspectRatio: "1/1",
                  overflow: "hidden",
                  cursor: "pointer",
                  objectFit: "cover",
                  objectPosition: "center",
                }}
              />
            </li>
          ))}
        </ul>
      </Flex>
    </Box>
  );
};
