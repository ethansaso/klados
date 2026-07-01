import { Box, HoverCard, Spinner, Text } from "@radix-ui/themes";
import type { MediaDTO } from "../../lib/domain/media/types";
import { getMediaUrl } from "../../lib/storage/getMediaUrl";
import { AnnotationBubbleWrap } from "../annotations/AnnotationBubbleWrap";

interface Props {
  info?: {
    title: string;
    description: string;
    media: MediaDTO | null;
  };
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const GlossaryCard: React.FC<Props> = ({
  info,
  onOpenChange,
  children,
}) => {
  return (
    <HoverCard.Root onOpenChange={onOpenChange}>
      <HoverCard.Trigger>{children}</HoverCard.Trigger>
      <HoverCard.Content maxWidth="224px" size="1" align="center" side="top">
        {info ? (
          <>
            {info.media && (
              <AnnotationBubbleWrap media={info.media} spacing="1">
                <Box mb="2">
                  <img
                    src={getMediaUrl(info.media.storageKey)}
                    alt={info.media.title}
                    style={{
                      width: "100%",
                      aspectRatio: "16/9",
                      objectFit: "cover",
                      borderRadius: "var(--radius-2)",
                    }}
                  />
                </Box>
              </AnnotationBubbleWrap>
            )}
            {info.title && (
              <Text as="p" weight="bold" size="1">
                {info.title}
              </Text>
            )}
            {info.description && (
              <Text as="p" size="1" color="gray" mt="1">
                {info.description}
              </Text>
            )}
          </>
        ) : (
          <Spinner size="2" />
        )}
      </HoverCard.Content>
    </HoverCard.Root>
  );
};
