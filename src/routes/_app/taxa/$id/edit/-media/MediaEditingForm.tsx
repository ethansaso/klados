import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button, Table } from "@radix-ui/themes";
import { useFieldArray, useFormContext } from "react-hook-form";
import { FaDove } from "react-icons/fa";
import { PiPlus } from "react-icons/pi";
import { TaxonEditFormValues } from "..";
import { FormDescriptor } from "../../../../../../components/FormDescriptor";
import { toast } from "../../../../../../lib/utils/toast";
import { selectInatPhotos } from "./InatPhotoSelectModal";
import { MediaTableRow } from "./MediaTableRow";

type MediaEditorProps = {
  inatId: number | null;
};

export const MediaEditingForm = ({ inatId }: MediaEditorProps) => {
  const { control, getValues } = useFormContext<TaxonEditFormValues>();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "media",
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const itemIds = fields.map((f) => f.id);

  const addRow = () =>
    append({ url: "", license: "unknown", owner: "", source: "" });

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

    const existingUrls = new Set(getValues("media").map((m) => m.url));
    const newItems = picked.filter((m) => !existingUrls.has(m.url));
    if (newItems.length) append(newItems);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    if (active.id === over.id) return;

    const from = fields.findIndex((f) => f.id === active.id);
    const to = fields.findIndex((f) => f.id === over.id);
    if (from === -1 || to === -1) return;

    move(from, to);
  };

  return (
    <FormDescriptor
      title="Media"
      description="Media can be added manually or imported using the iNaturalist button. Remember to properly attribute media sources, and only use media you have rights to use."
      actions={
        <>
          <Button type="button" radius="full" size="1" onClick={addRow}>
            <PiPlus size="16" />
            Add Media
          </Button>
          <Button
            type="button"
            radius="full"
            size="1"
            color="grass"
            onClick={addFromInat}
          >
            <FaDove size="16" />
            Import from iNaturalist
          </Button>
        </>
      }
      orientation="vertical"
    >
      {fields.length === 0 ? null : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={itemIds}
            strategy={verticalListSortingStrategy}
          >
            <Table.Root variant="surface" size="1">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Preview</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Image URL</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>License</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Owner</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Source URL</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Delete</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {fields.map((row, i) => {
                  return (
                    <MediaTableRow
                      key={row.id}
                      id={row.id}
                      index={i}
                      onRemove={() => remove(i)}
                    />
                  );
                })}
              </Table.Body>
            </Table.Root>
          </SortableContext>
        </DndContext>
      )}
    </FormDescriptor>
  );
};
