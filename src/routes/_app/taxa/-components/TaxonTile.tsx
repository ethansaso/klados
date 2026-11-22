import "./TaxonTile.css";

import { Text } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import { memo } from "react";
import { AnnotationBubbleWrap } from "../../../../components/annotations/AnnotationBubbleWrap";
import { MediaImage } from "../../../../components/MediaImage";
import { TaxonName } from "../../../../components/TaxonName";
import { type TaxonDTO } from "../../../../lib/domain/taxa/types";
import { taxonParams } from "../../../../lib/utils/formatting/taxonUrl";

type Props = {
  taxon: Pick<
    TaxonDTO,
    "id" | "rank" | "acceptedName" | "preferredCommonName" | "media"
  >;
  /** `<img sizes>` for the tile's rendered width. */
  sizes: string;
};

const PLACEHOLDER_SRC = "/logos/LogoDotted.svg";

/** Photo tile with the name overlaid. Size decided by wrapping grid. */
export const TaxonTile = memo(function TaxonTile({ taxon, sizes }: Props) {
  const { id, rank, acceptedName, preferredCommonName } = taxon;
  const thumbnail = taxon.media[0];

  return (
    <AnnotationBubbleWrap media={thumbnail} spacing="1">
      <Link
        className="taxon-tile"
        to="/taxa/$id"
        params={taxonParams({ id, acceptedName })}
      >
        <MediaImage
          media={thumbnail}
          fallbackSrc={PLACEHOLDER_SRC}
          sizes={sizes}
          // Featured tiles are 3:2 but square on phones; 1 keeps both sharp.
          coverAspect={1}
          alt=""
          loading="lazy"
        />
        <div className="taxon-tile__caption">
          <Text as="div" className="taxon-tile__name" truncate>
            <TaxonName rank={rank} name={acceptedName} />
          </Text>
          {preferredCommonName && (
            <Text as="div" className="taxon-tile__common-name" truncate>
              {preferredCommonName}
            </Text>
          )}
        </div>
      </Link>
    </AnnotationBubbleWrap>
  );
});
