import { Box, Card, Flex, Inset, Text } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import classNames from "classnames";
import { memo, type PropsWithChildren } from "react";
import type { TaxonRank } from "../../db/schema/schema";
import type { MediaDTO } from "../lib/domain/media/types";
import { getMediaUrl } from "../lib/storage/getMediaUrl";
import { capitalizeFirstLetter } from "../lib/utils/formatting/casing";
import { formatTaxonName } from "../lib/utils/formatting/formatTaxonName";
import { AnnotationBubbleWrap } from "./annotations/AnnotationBubbleWrap";
import "./TaxonCard.css";
import { TaxonName } from "./TaxonName";

interface TaxonCardProps {
  id: number;
  rank: TaxonRank;
  acceptedName: string;
  preferredCommonName?: string | null;
  thumbnail?: MediaDTO | null;
  inset?: boolean;
  size?: "1" | "2";
  serveAsLink?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const TaxonCard = memo(
  ({
    children,
    thumbnail,
    id,
    acceptedName,
    preferredCommonName,
    rank,
    size = "2",
    serveAsLink = false,
    onClick,
  }: PropsWithChildren<TaxonCardProps>) => {
    const className = classNames("taxon-card");
    const content = (
      <>
        <Inset side="top" pb="current">
          <img
            src={
              thumbnail
                ? getMediaUrl(thumbnail.storageKey)
                : "/logos/LogoDotted.svg"
            }
            alt={formatTaxonName(rank, acceptedName)}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/logos/LogoDotted.svg";
            }}
          />
        </Inset>
        <Flex direction="column" flexGrow="1" justify="between">
          <Box className="taxonomy">
            <Text as="div" size="1" weight="bold" color="gray">
              {capitalizeFirstLetter(rank)}
            </Text>
            <Text
              className="taxon-name"
              as="div"
              size={size === "2" ? { initial: "1", xs: "2" } : { initial: "1" }}
              truncate
            >
              <TaxonName rank={rank} name={acceptedName} prefixMode="never" />
            </Text>
            {preferredCommonName && (
              <Text as="div" size="1" color="gray" truncate>
                {preferredCommonName}
              </Text>
            )}
          </Box>
          {children}
        </Flex>
      </>
    );

    return (
      <AnnotationBubbleWrap media={thumbnail} spacing={size}>
        {serveAsLink ? (
          <Card className={className} size={size} asChild>
            <Link to="/taxa/$id" params={{ id }}>
              {content}
            </Link>
          </Card>
        ) : onClick ? (
          <Card className={className} asChild>
            <button onClick={onClick}>{content}</button>
          </Card>
        ) : (
          <Card className={className}>{content}</Card>
        )}
      </AnnotationBubbleWrap>
    );
  },
);
