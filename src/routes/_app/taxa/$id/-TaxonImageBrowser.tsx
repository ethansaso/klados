import "./-TaxonImageBrowser.css";

import { Box, Flex, Heading, Text, Theme } from "@radix-ui/themes";
import { useState } from "react";
import { AnnotationBubbleWrap } from "../../../../components/annotations/AnnotationBubbleWrap";
import { TaxonName } from "../../../../components/TaxonName";
import type { TaxonDetailDTO } from "../../../../lib/domain/taxa/types";
import { getMediaUrl } from "../../../../lib/storage/getMediaUrl";
import { formatTaxonName } from "../../../../lib/utils/formatting/formatTaxonName";

const PLACEHOLDER_SRC = "/logos/LogoDotted.svg";

export const TaxonImageBrowser = ({ taxon }: { taxon: TaxonDetailDTO }) => {
  const { media, rank, acceptedName, preferredCommonName } = taxon;
  const taxonName = formatTaxonName(rank, acceptedName);
  const [selectedMediaIdx, setSelectedMediaIdx] = useState(0);
  const displayedMediaItem = media.at(selectedMediaIdx) ?? null;
  const displayedMediaSrc = displayedMediaItem
    ? getMediaUrl(displayedMediaItem.storageKey)
    : PLACEHOLDER_SRC;
  const hasMultipleMedia = media.length > 1;

  return (
    <Box
      className={`taxon-image-browser${hasMultipleMedia ? " taxon-image-browser--with-thumbnails" : ""}`}
    >
      <Box className="taxon-image-browser__preview">
        <AnnotationBubbleWrap media={displayedMediaItem} spacing="2">
          <img
            className="taxon-image-browser__preview-image"
            src={displayedMediaSrc}
            alt={
              displayedMediaItem
                ? `${taxonName}, copyright ${displayedMediaItem.owner}`
                : `Placeholder image for ${taxonName}`
            }
          />
        </AnnotationBubbleWrap>
        {/* Phone overlay. */}
        <div className="taxon-image-browser__overlay">
          <Heading
            size="6"
            weight="medium"
            trim={preferredCommonName ? "start" : "both"}
          >
            <TaxonName rank={rank} name={acceptedName} />
          </Heading>
          {preferredCommonName && (
            <Text as="p" size="2" trim="end">
              {preferredCommonName}
            </Text>
          )}
        </div>
      </Box>

      {/* Dark in either theme so the strip reads as a filmstrip. */}
      {hasMultipleMedia && (
        <Theme asChild appearance="dark" hasBackground={false}>
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
        </Theme>
      )}
    </Box>
  );
};
