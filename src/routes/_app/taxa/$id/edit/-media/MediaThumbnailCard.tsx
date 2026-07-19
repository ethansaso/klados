import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, IconButton } from "@radix-ui/themes";
import { PiX } from "react-icons/pi";
import { getMediaUrl } from "../../../../../../lib/storage/getMediaUrl";

type MediaThumbnailCardProps = {
  id: string;
  storageKey: string;
  onRemove: () => void;
};

export const MediaThumbnailCard = ({
  id,
  storageKey,
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
        backgroundImage: `url("${getMediaUrl(storageKey)}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        cursor: isDragging ? "grabbing" : "grab",
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1 : "auto",
      }}
      {...listeners}
    >
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
