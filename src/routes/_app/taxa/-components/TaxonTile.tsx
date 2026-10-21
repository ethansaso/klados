import "./TaxonTile.css";

import { Text } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import { memo } from "react";
import { AnnotationBubbleWrap } from "../../../../components/annotations/AnnotationBubbleWrap";
import { TaxonName } from "../../../../components/TaxonName";
import { type TaxonDTO } from "../../../../lib/domain/taxa/types";
import { getMediaUrl } from "../../../../lib/storage/getMediaUrl";
import { taxonParams } from "../../../../lib/utils/formatting/taxonUrl";

type Props = {
  taxon: Pick<
    TaxonDTO,
    "id" | "rank" | "acceptedName" | "preferredCommonName" | "media"
  >;
};

const PLACEHOLDER_SRC = "/logos/LogoDotted.svg";

/** Photo tile with the name overlaid. Size decided by wrapping grid. */
export const TaxonTile = memo(function TaxonTile({ taxon }: Props) {
  const { id, rank, acceptedName, preferredCommonName } = taxon;
  const thumbnail = taxon.media[0];

  return (
    <AnnotationBubbleWrap media={thumbnail} spacing="1">
      <Link
        className="taxon-tile"
        to="/taxa/$id"
        params={taxonParams({ id, acceptedName })}
      >
        <img
          src={thumbnail ? getMediaUrl(thumbnail.storageKey) : PLACEHOLDER_SRC}
          data-placeholder={thumbnail ? undefined : ""}
          alt=""
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = PLACEHOLDER_SRC;
            e.currentTarget.dataset.placeholder = "";
          }}
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
