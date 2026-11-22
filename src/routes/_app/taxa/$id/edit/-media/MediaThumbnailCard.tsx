import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, IconButton } from "@radix-ui/themes";
import { PiX } from "react-icons/pi";
import { MediaImage } from "../../../../../../components/MediaImage";
import type { MediaFormItem } from "./validation";

type MediaThumbnailCardProps = {
  id: string;
  media: MediaFormItem;
  onRemove: () => void;
};

export const MediaThumbnailCard = ({
  id,
  media,
  onRemove,
}: MediaThumbnailCardProps) => {
  const { listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <Box
      position="relative"
      width="100%"
      ref={setNodeRef}
      style={{
        aspectRatio: "1 / 1",
        transform: CSS.Translate.toString(transform),
        transition,
        borderRadius: "var(--radius-4)",
        border: "1px solid var(--gray-6)",
        backgroundColor: "var(--gray-3)",
        overflow: "hidden",
        cursor: isDragging ? "grabbing" : "grab",
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1 : "auto",
      }}
      {...listeners}
    >
      <MediaImage
        media={media}
        sizes="auto, 160px"
        alt=""
        loading="lazy"
        draggable={false}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      <Box asChild position="absolute" top="1" right="1">
        <IconButton
          type="button"
          radius="full"
          size="1"
          color="tomato"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onRemove}
        >
          <PiX size={16} />
        </IconButton>
      </Box>
    </Box>
  );
};
