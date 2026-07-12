import { Box, Card, Flex, Text } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import classNames from "classnames";
import { memo, type PropsWithChildren } from "react";
import type { MediaDTO } from "../lib/domain/media/types";
import { getMediaUrl } from "../lib/storage/getMediaUrl";
import { capitalizeFirstLetter } from "../lib/utils/formatting/casing";
import { AnnotationBubbleWrap } from "./annotations/AnnotationBubbleWrap";

interface TaxonCardProps {
  id: number;
  rank: string;
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
    inset,
    size = "2",
    serveAsLink = false,
    onClick,
  }: PropsWithChildren<TaxonCardProps>) => {
    const className = classNames("taxon-card", inset && "inset");
    const content = (
      <>
        <img
          src={
            thumbnail
              ? getMediaUrl(thumbnail.storageKey)
              : "/logos/LogoDotted.svg"
          }
          alt={acceptedName}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/logos/LogoDotted.svg";
          }}
        />
        <Flex direction="column" flexGrow="1" justify="between">
          <Box className="taxonomy">
            <Text as="div" size="1" weight="bold" color="gray">
              {capitalizeFirstLetter(rank)}
            </Text>
            <Text
              as="div"
              weight="bold"
              size={
                size === "2"
                  ? { initial: "1", xs: "2", sm: "3" }
                  : { initial: "1" }
              }
              truncate
            >
              {acceptedName}
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
      <AnnotationBubbleWrap
        media={thumbnail}
        spacing={inset ? { initial: "1", sm: "2" } : { initial: "1", sm: "4" }}
      >
        {serveAsLink ? (
          <Card className={className} size="1" asChild>
            <Link to="/taxa/$id" params={{ id: String(id) }}>
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
