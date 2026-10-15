import { Inset, Spinner, Text } from "@radix-ui/themes";
import type { MediaDTO } from "../../lib/domain/media/types";
import { getMediaUrl } from "../../lib/storage/getMediaUrl";
import { AnnotationBubbleWrap } from "../annotations/AnnotationBubbleWrap";
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

export const GlossaryCard: React.FC<Props> = ({
  info,
  onOpenChange,
  children,
}) => {
  return (
    <ResponsiveHoverCard
      onOpenChange={onOpenChange}
      contentProps={{
        maxWidth: "224px",
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
                  <img
                    src={getMediaUrl(info.media.storageKey)}
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
