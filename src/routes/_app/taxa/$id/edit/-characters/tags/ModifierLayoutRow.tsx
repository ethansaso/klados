import { DragDropProvider, useDroppable } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { Badge, Button, Flex, IconButton } from "@radix-ui/themes";
import { useCallback, useMemo, type ReactNode } from "react";
import { PiX } from "react-icons/pi";
import {
  cycleModifierJoiner,
  inDisplayOrder,
  moveModifier,
} from "../dnd/modifierUtils";
import {
  REORDER_PLUGINS,
  REORDER_SENSORS,
  REORDER_SORTABLE_PLUGINS,
  useListReorder,
  type DropGap,
} from "../dnd/useListReorder";
import type { ModifierTokenFormValue } from "../validation";
import "./ModifierLayoutRow.css";

type Props = {
  modifiers: ModifierTokenFormValue[];
  /** The state's value, shown between prefixes and suffixes. */
  value: ReactNode;
  onChange: (modifiers: ModifierTokenFormValue[]) => void;
};

type Marker = Pick<DropGap, "side" | "axis"> | undefined;

const VALUE_ID = "value";

const JOINER_GLYPHS: Record<ModifierTokenFormValue["joiner"], string> = {
  space: "",
  slash: "/",
  comma: ",",
};

/** A state's modifiers around its value, reordered by dragging across it. */
export function ModifierLayoutRow({ modifiers, value, onChange }: Props) {
  const ordered = useMemo(() => inDisplayOrder(modifiers), [modifiers]);
  const prefixCount = ordered.filter((m) => m.affixType === "prefix").length;
  const ids = useMemo(() => {
    const modifierIds = ordered.map((m) => String(m.id));
    modifierIds.splice(prefixCount, 0, VALUE_ID);
    return modifierIds;
  }, [ordered, prefixCount]);

  // Indexes include the fixed value, which divides prefixes from suffixes
  const handleMove = useCallback(
    (fromIndex: number, toIndex: number) => {
      // Where the value sits once the dragged modifier is lifted out
      const valueIndex =
        fromIndex < prefixCount ? prefixCount - 1 : prefixCount;
      const affixType = toIndex <= valueIndex ? "prefix" : "suffix";
      onChange(
        moveModifier(
          modifiers,
          fromIndex > prefixCount ? fromIndex - 1 : fromIndex,
          toIndex > valueIndex ? toIndex - 1 : toIndex,
          affixType,
        ),
      );
    },
    [modifiers, prefixCount, onChange],
  );
  const { marker, handleDragMove, handleDragEnd } = useListReorder(
    ids,
    handleMove,
  );

  const markerFor = (id: string): Marker =>
    marker?.targetId === id ? marker : undefined;
  const renderModifier = (m: ModifierTokenFormValue, i: number) => (
    <SortableModifier
      key={m.id}
      modifier={m}
      index={ids.indexOf(String(m.id))}
      showJoiner={i > 0 || m.affixType === "suffix"}
      marker={markerFor(String(m.id))}
      onCycleJoiner={() => onChange(cycleModifierJoiner(modifiers, m.id))}
      onRemove={() => onChange(modifiers.filter((x) => x.id !== m.id))}
    />
  );

  return (
    <DragDropProvider
      sensors={REORDER_SENSORS}
      plugins={REORDER_PLUGINS}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <Flex wrap="wrap" align="center" gap="1">
        {ordered.slice(0, prefixCount).map(renderModifier)}
        <ValueAnchor marker={markerFor(VALUE_ID)}>{value}</ValueAnchor>
        {ordered.slice(prefixCount).map(renderModifier)}
      </Flex>
    </DragDropProvider>
  );
}

function SortableModifier({
  modifier,
  index,
  showJoiner,
  marker,
  onCycleJoiner,
  onRemove,
}: {
  modifier: ModifierTokenFormValue;
  index: number;
  showJoiner: boolean;
  marker: Marker;
  onCycleJoiner: () => void;
  onRemove: () => void;
}) {
  const { ref, handleRef } = useSortable({
    id: String(modifier.id),
    index,
    plugins: REORDER_SORTABLE_PLUGINS,
    transition: null,
  });

  return (
    <Flex
      ref={ref}
      align="center"
      gap="1"
      position="relative"
      className="reorder-item"
      data-drop-side={marker?.side}
      data-drop-axis={marker?.axis}
    >
      {showJoiner && (
        <Button
          type="button"
          size="1"
          variant="ghost"
          color={modifier.joiner === "space" ? "gray" : undefined}
          className="modifier-layout__joiner"
          data-joiner={modifier.joiner}
          aria-label={`Joiner before ${modifier.label}: ${modifier.joiner}`}
          onClick={onCycleJoiner}
        >
          {JOINER_GLYPHS[modifier.joiner]}
        </Button>
      )}
      <Badge
        ref={handleRef}
        variant="soft"
        color={modifier.affixType === "prefix" ? "crimson" : "cyan"}
        className="modifier-layout__modifier"
      >
        {modifier.label}
        <IconButton
          type="button"
          size="1"
          variant="ghost"
          aria-label={`Remove ${modifier.label}`}
          onClick={onRemove}
        >
          <PiX />
        </IconButton>
      </Badge>
    </Flex>
  );
}

function ValueAnchor({
  marker,
  children,
}: {
  marker: Marker;
  children: ReactNode;
}) {
  const { ref } = useDroppable({ id: VALUE_ID });

  return (
    <Flex
      ref={ref}
      position="relative"
      className="reorder-item"
      data-drop-side={marker?.side}
      data-drop-axis={marker?.axis}
    >
      <Badge variant="outline" color="gray" className="modifier-layout__value">
        {children}
      </Badge>
    </Flex>
  );
}
