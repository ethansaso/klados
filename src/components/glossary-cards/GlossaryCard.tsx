import { Inset, Spinner, Text } from "@radix-ui/themes";
import type { MediaDTO } from "../../lib/domain/media/types";
import { AnnotationBubbleWrap } from "../annotations/AnnotationBubbleWrap";
import { MediaImage } from "../MediaImage";
import { ResponsiveHoverCard } from "../ResponsiveHoverCard";

interface Props {
  info?: {
    title: string;
    description: string;
    media: MediaDTO | null;
  };
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const CARD_MAX_WIDTH = "224px";

export const GlossaryCard: React.FC<Props> = ({
  info,
  onOpenChange,
  children,
}) => {
  return (
    <ResponsiveHoverCard
      onOpenChange={onOpenChange}
      contentProps={{
        maxWidth: CARD_MAX_WIDTH,
        size: "1",
        align: "center",
        side: "top",
      }}
      content={
        info ? (
          <>
            {info.media && (
              <Inset side="top" pb="current">
                <AnnotationBubbleWrap media={info.media} spacing="2">
                  <MediaImage
                    media={info.media}
                    sizes={CARD_MAX_WIDTH}
                    alt={info.media.title}
                    style={{
                      width: "100%",
                      aspectRatio: "16/9",
                      objectFit: "cover",
                    }}
                  />
                </AnnotationBubbleWrap>
              </Inset>
            )}
            {info.title && (
              <Text as="p" weight="bold" size="2">
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
        )
      }
    >
      {children}
    </ResponsiveHoverCard>
  );
};
