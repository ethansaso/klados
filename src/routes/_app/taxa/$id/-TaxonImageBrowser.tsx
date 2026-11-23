import "./-TaxonImageBrowser.css";

import { Box, Flex, Heading, Text, Theme } from "@radix-ui/themes";
import { useState } from "react";
import { AnnotationBubbleWrap } from "../../../../components/annotations/AnnotationBubbleWrap";
import { viewMediaFullscreen } from "../../../../components/dialogs/MediaLightbox";
import { MediaImage } from "../../../../components/MediaImage";
import { TaxonName } from "../../../../components/TaxonName";
import type { TaxonDetailDTO } from "../../../../lib/domain/taxa/types";
import { getMediaUrl } from "../../../../lib/storage/getMediaUrl";
import { formatTaxonName } from "../../../../lib/utils/formatting/formatTaxonName";

const PLACEHOLDER_SRC = "/logos/LogoDotted.svg";

export const TaxonImageBrowser = ({ taxon }: { taxon: TaxonDetailDTO }) => {
  const { media, rank, acceptedName, preferredCommonName } = taxon;
  const taxonName = formatTaxonName(rank, acceptedName);
  const [selectedMediaIdx, setSelectedMediaIdx] = useState(0);
  // First photo renders before hydration, so only handle backdrop logic on true switches
  const [hasSwitched, setHasSwitched] = useState(false);
  const displayedMediaItem = media.at(selectedMediaIdx) ?? null;
  const hasMultipleMedia = media.length > 1;

  const preview = (
    <MediaImage
      // A fresh element per photo, so the old one never lingers on screen
      key={displayedMediaItem?.storageKey}
      className="taxon-image-browser__preview-image"
      media={displayedMediaItem}
      fallbackSrc={PLACEHOLDER_SRC}
      sizes="(max-width: 767px) 100vw, 304px"
      coverAspect={1}
      alt={
        displayedMediaItem
          ? `${taxonName}, copyright ${displayedMediaItem.owner}`
          : `Placeholder image for ${taxonName}`
      }
      // The strip has already loaded `small`
      placeholderSrc={
        hasSwitched && displayedMediaItem
          ? getMediaUrl(displayedMediaItem, "small")
          : undefined
      }
    />
  );

  return (
    <Box
      className={`taxon-image-browser${hasMultipleMedia ? " taxon-image-browser--with-thumbnails" : ""}`}
    >
      <Box className="taxon-image-browser__preview">
        <AnnotationBubbleWrap media={displayedMediaItem} spacing="2">
          {displayedMediaItem ? (
            <button
              type="button"
              className="taxon-image-browser__open"
              aria-label={`View ${taxonName} image ${selectedMediaIdx + 1} full screen`}
              onClick={(e) =>
                viewMediaFullscreen({
                  media,
                  startIndex: selectedMediaIdx,
                  label: taxonName,
                  startPlaceholderSrc:
                    e.currentTarget.querySelector("img")?.currentSrc,
                })
              }
            >
              {preview}
            </button>
          ) : (
            preview
          )}
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
                    onClick={() => {
                      setSelectedMediaIdx(idx);
                      setHasSwitched(true);
                    }}
                    aria-label={`Show ${taxonName} image ${idx + 1}`}
                    aria-pressed={idx === selectedMediaIdx}
                  >
                    <MediaImage
                      media={mediaItem}
                      // Use real thumbnail split at bottom w/ fallback to 76px
                      sizes="auto, (max-width: 767px) 48px, 76px"
                      coverAspect={1}
                      loading="lazy"
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
