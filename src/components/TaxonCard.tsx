import { Box, Card, Flex, Text } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import { memo, PropsWithChildren } from "react";
import { MediaItem } from "../lib/domain/taxa/validation";
import { capitalizeFirstLetter } from "../lib/utils/casing";
import { AnnotationBubbleWrap } from "./AnnotationBubbleWrap";

interface TaxonCardProps {
  id: number;
  rank: string;
  acceptedName: string;
  preferredCommonName?: string | null;
  thumbnail?: MediaItem | null;
  serveAsLink?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const TaxonCard = memo(
  ({
    thumbnail,
    id,
    acceptedName,
    preferredCommonName,
    rank,
    serveAsLink = false,
    onClick,
    children,
  }: PropsWithChildren<TaxonCardProps>) => {
    const content = (
      <>
        <img
          src={thumbnail?.url ?? "/logos/LogoDotted.svg"}
          alt={acceptedName}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/logos/LogoDotted.svg";
          }}
        />
        <Flex direction="column" flexGrow="1" justify="between">
          <Box mb="1">
            <Text as="div" size="1" weight="bold" color="gray">
              {capitalizeFirstLetter(rank)}
            </Text>
            <Text as="div" weight="bold" truncate>
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
      <AnnotationBubbleWrap media={thumbnail} spacing="4">
        {serveAsLink ? (
          <Card className="taxon-card" asChild>
            <Link to="/taxa/$id" params={{ id: String(id) }}>
              {content}
            </Link>
          </Card>
        ) : onClick ? (
          <Card className="taxon-card" asChild>
            <button onClick={onClick}>{content}</button>
          </Card>
        ) : (
          <Card className="taxon-card">{content}</Card>
        )}
      </AnnotationBubbleWrap>
    );
  }
);
