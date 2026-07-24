import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import NiceModal from "@ebay/nice-modal-react";
import { Box, Button, Flex, Grid, Heading } from "@radix-ui/themes";
import { useFieldArray, useFormContext } from "react-hook-form";
import { FaDove } from "react-icons/fa";
import { PiPlus } from "react-icons/pi";
import type { TaxonEditFormValues } from "..";
import MediaBrowser from "../../../../../../components/media-browser";
import type { MediaDTO } from "../../../../../../lib/domain/media/types";
import { toast } from "../../../../../../lib/utils/toast";
import { selectInatPhotos } from "./InatPhotoSelectModal";
import { MediaThumbnailCard } from "./MediaThumbnailCard";

type MediaEditorProps = {
  inatId: number | null;
};

export const MediaEditingForm = ({ inatId }: MediaEditorProps) => {
  const { control, getValues } = useFormContext<TaxonEditFormValues>();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "media",
    keyName: "rhfId",
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const itemIds = fields.map((f) => f.rhfId);

  const appendDeduped = (items: MediaDTO[]) => {
    const existingIds = new Set(getValues("media").map((m) => m.id));
    const newItems = items.filter((m) => !existingIds.has(m.id));
    if (newItems.length) append(newItems);
  };

  const addFromInat = async () => {
    if (!inatId) {
      toast({
        variant: "error",
        description: "Please set the iNaturalist ID first.",
      });
      return;
    }
    const picked = await selectInatPhotos(inatId);
    if (!picked?.length) return;
    appendDeduped(picked);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    if (active.id === over.id) return;

    const from = fields.findIndex((f) => f.rhfId === active.id);
    const to = fields.findIndex((f) => f.rhfId === over.id);
    if (from === -1 || to === -1) return;

    move(from, to);
  };

  return (
    <Box>
      <Flex justify="between" align="center" mb="2">
        <Heading size="3">Media</Heading>
        <Flex gap="1">
          <Button
            type="button"
            variant="ghost"
            radius="full"
            size="1"
            onClick={() => remove()}
            style={{ margin: 0 }}
          >
            Clear
          </Button>
          <Button
            type="button"
            radius="full"
            size="1"
            onClick={() =>
              NiceModal.show(MediaBrowser, {
                mode: "multi",
                onSelect: appendDeduped,
              })
            }
          >
            <PiPlus size="16" />
            Add
          </Button>
          <Button
            type="button"
            radius="full"
            size="1"
            color="grass"
            onClick={addFromInat}
          >
            <FaDove size="16" />
            iNat
          </Button>
        </Flex>
      </Flex>
      {fields.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToParentElement]}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={itemIds} strategy={rectSortingStrategy}>
            <Grid
              columns="repeat(auto-fill, minmax(min(96px, 100%), 1fr))"
              gap="2"
            >
              {fields.map((field, i) => (
                <MediaThumbnailCard
                  key={field.rhfId}
                  id={field.rhfId}
                  storageKey={field.storageKey}
                  onRemove={() => remove(i)}
                />
              ))}
            </Grid>
          </SortableContext>
        </DndContext>
      )}
    </Box>
  );
};
