import { Box, Flex } from "@radix-ui/themes";
import { useState } from "react";
import { MediaItem } from "../../../../lib/domain/taxa/validation";

const IMG_SIZE = 256;
const THUMB_SIZE = 48;

// TODO: Scrolling thumbnails if too many to fit
export const TaxonImageBrowser = ({ media }: { media: MediaItem[] }) => {
  const [selectedMediaIdx, setSelectedMediaIdx] = useState(0);
  const displayedMediaItem = media[selectedMediaIdx];

  return (
    <Box className="taxon-image-browser">
      <img
        src={displayedMediaItem?.url ?? "/logos/LogoDotted.svg"}
        style={{
          display: "block",
          height: IMG_SIZE,
          aspectRatio: "1/1",
          objectPosition: "center",
          objectFit: "cover",
          overflow: "hidden",
        }}
      />
      <Flex
        className="taxon-image-browser__thumbnails"
        style={{ maxWidth: IMG_SIZE, overflow: "hidden" }}
        asChild
      >
        <ul>
          {media.map((mediaItem, idx) => (
            <li key={idx}>
              <img
                src={mediaItem.url}
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
