import {
  Accessibility,
  defaultPreset,
  Feedback,
  PointerActivationConstraints,
  PointerSensor,
} from "@dnd-kit/dom";
import type {
  DragDropManager,
  DragEndEvent,
  DragMoveEvent,
} from "@dnd-kit/react";
import { useCallback, useState } from "react";
import "./useListReorder.css";

type Rect = { top: number; bottom: number; left: number; right: number };

type Point = { x: number; y: number };

type Line<T> = { start: number; items: T[]; top: number; bottom: number };

/**
 * Positioned gap between items.
 * `index` is the insertion point in the full list, marker sits on `side` of
 * `targetId` along `axis`.
 */
export type DropGap = {
  index: number;
  targetId: string;
  side: "before" | "after";
  axis: "x" | "y";
};

type DropSlot = DropGap & { sourceId: string };

// Pointer only; Enter and Space are for popovers
export const REORDER_SENSORS = [
  PointerSensor.configure({
    // Clicks must trigger popover. Also, don't disrupt touch scroll.
    activationConstraints: (event) =>
      event.pointerType === "touch"
        ? [new PointerActivationConstraints.Delay({ value: 250, tolerance: 5 })]
        : [new PointerActivationConstraints.Distance({ value: 5 })],
  }),
];

export const REORDER_PLUGINS = defaultPreset.plugins.filter(
  (plugin) => plugin !== Accessibility,
);

// Purposely disables live reordering to prevent jitter.
// The small interaction zone + volatility makes it unstable.
export const REORDER_SORTABLE_PLUGINS = [
  Feedback.configure({ feedback: "clone", dropAnimation: null }),
];

/**
 * Drag handlers for one wrapped list, plus the drop marker to show.
 * `ids` are every item's droppable id in order, including fixed items that
 * can be dropped beside but not dragged.
 * Items need the `reorder-item` class and the marker's data attributes.
 */
export function useListReorder(
  ids: string[],
  onMove: (fromIndex: number, toIndex: number) => void,
) {
  const [dropSlot, setDropSlot] = useState<DropSlot | null>(null);

  const handleDragMove = useCallback(
    (event: DragMoveEvent, manager: DragDropManager) => {
      const next = getDropSlot(event.operation, manager, ids);
      setDropSlot((prev) =>
        prev?.index === next?.index &&
        prev?.targetId === next?.targetId &&
        prev?.side === next?.side
          ? prev
          : next,
      );
    },
    [ids],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent, manager: DragDropManager) => {
      setDropSlot(null);
      const slot = getDropSlot(event.operation, manager, ids);
      const move = slot && resolveMove(ids, slot);
      if (event.canceled || !move) return;
      onMove(move.fromIndex, move.toIndex);
    },
    [ids, onMove],
  );

  // No marker where dropping would leave the order unchanged
  const marker = dropSlot && resolveMove(ids, dropSlot) ? dropSlot : null;

  return { marker, handleDragMove, handleDragEnd };
}

/**
 * Resolved from the dragged item's center, so the grab point doesn't matter.
 * Items are measured now, since dnd-kit's shapes update asynchronously.
 */
function getDropSlot(
  operation: DragEndEvent["operation"],
  manager: DragDropManager,
  ids: string[],
): DropSlot | null {
  const { source, shape, position } = operation;
  if (!source) return null;
  const sourceId = String(source.id);

  const elements = new Map(
    Array.from(manager.registry.droppables, (droppable) => [
      String(droppable.id),
      droppable.element,
    ]),
  );
  const items = ids.flatMap((id) => {
    const element = elements.get(id);
    return element ? [{ id, rect: element.getBoundingClientRect() }] : [];
  });

  const gap = findDropGap(items, shape?.current.center ?? position.current);
  return gap && { ...gap, sourceId };
}

/**
 * The gap nearest `point` among wrapped, LTR `items` in order, including the
 * dragged one's slot, so gaps beside it resolve to "no change". A line is
 * chosen by height, split halfway between lines; a lone item's gaps are above
 * and below it, and gaps within a longer line go by width. Points above or
 * below the whole list land at its start or end.
 */
function findDropGap(
  items: Array<{ id: string; rect: Rect }>,
  point: Point,
): DropGap | null {
  const lines: Array<Line<(typeof items)[number]>> = [];
  for (const [i, item] of items.entries()) {
    const line = lines.at(-1);
    if (line && item.rect.top < line.bottom) {
      line.items.push(item);
      line.top = Math.min(line.top, item.rect.top);
      line.bottom = Math.max(line.bottom, item.rect.bottom);
    } else {
      lines.push({
        start: i,
        items: [item],
        top: item.rect.top,
        bottom: item.rect.bottom,
      });
    }
  }

  const first = lines[0];
  const last = lines.at(-1);
  if (!first || !last) return null;

  // Lifting an item's middle clear of the list reaches its ends from any column
  if (point.y < first.top) {
    return {
      index: 0,
      targetId: first.items[0]!.id,
      side: "before",
      axis: first.items.length === 1 ? "y" : "x",
    };
  }
  if (point.y > last.bottom) {
    return {
      index: items.length,
      targetId: last.items.at(-1)!.id,
      side: "after",
      axis: last.items.length === 1 ? "y" : "x",
    };
  }

  let line = first;
  for (const [i, next] of lines.entries()) {
    const prev = lines[i - 1];
    if (prev && point.y >= (prev.bottom + next.top) / 2) line = next;
  }

  const [only] = line.items;
  if (only && line.items.length === 1) {
    const after = point.y > (only.rect.top + only.rect.bottom) / 2;
    return {
      index: line.start + (after ? 1 : 0),
      targetId: only.id,
      side: after ? "after" : "before",
      axis: "y",
    };
  }

  const nextIndex = line.items.findIndex(
    (item) => point.x < (item.rect.left + item.rect.right) / 2,
  );
  if (nextIndex >= 0) {
    return {
      index: line.start + nextIndex,
      targetId: line.items[nextIndex]!.id,
      side: "before",
      axis: "x",
    };
  }
  return {
    index: line.start + line.items.length,
    targetId: line.items.at(-1)!.id,
    side: "after",
    axis: "x",
  };
}

/** Null when the slot is invalid or wouldn't change the order. */
function resolveMove(
  ids: string[],
  slot: DropSlot,
): { fromIndex: number; toIndex: number } | null {
  const fromIndex = ids.indexOf(slot.sourceId);
  if (fromIndex < 0) return null;
  // Removing the source first shifts later insertion points back by one
  const toIndex = slot.index > fromIndex ? slot.index - 1 : slot.index;
  return toIndex === fromIndex ? null : { fromIndex, toIndex };
}
