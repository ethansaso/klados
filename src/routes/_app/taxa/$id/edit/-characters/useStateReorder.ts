import type {
  DragDropManager,
  DragEndEvent,
  DragMoveEvent,
} from "@dnd-kit/react";
import { useCallback, useState } from "react";
import type { CharacterStateFormValue } from "./validation";

type Rect = { top: number; bottom: number; left: number; right: number };

type Point = { x: number; y: number };

type Line<T> = { start: number; items: T[]; top: number; bottom: number };

/**
 * Positioned gap between items.
 * `index` is landing site, marker sits on `side` of `targetId` along `axis`.
 */
export type DropGap = {
  index: number;
  targetId: string;
  side: "before" | "after";
  axis: "x" | "y";
};

type DropSlot = DropGap & { sourceId: string };

/** Drag handlers for one character's tag list, plus the drop marker to show. */
export function useStateReorder(
  states: CharacterStateFormValue[],
  onMove: (fromIndex: number, toIndex: number) => void,
) {
  const [dropSlot, setDropSlot] = useState<DropSlot | null>(null);

  const handleDragMove = useCallback(
    (event: DragMoveEvent, manager: DragDropManager) => {
      const next = getDropSlot(event.operation, manager, states);
      setDropSlot((prev) =>
        prev?.index === next?.index &&
        prev?.targetId === next?.targetId &&
        prev?.side === next?.side
          ? prev
          : next,
      );
    },
    [states],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent, manager: DragDropManager) => {
      setDropSlot(null);
      const slot = getDropSlot(event.operation, manager, states);
      const move = slot && resolveMove(states, slot);
      if (event.canceled || !move) return;
      onMove(move.fromIndex, move.toIndex);
    },
    [states, onMove],
  );

  // No marker where dropping would leave the order unchanged
  const marker = dropSlot && resolveMove(states, dropSlot) ? dropSlot : null;

  return { marker, handleDragMove, handleDragEnd };
}

/**
 * Resolved from the dragged tag's center, so the grab point doesn't matter.
 * Tags are measured now, since dnd-kit's shapes update asynchronously.
 */
function getDropSlot(
  operation: DragEndEvent["operation"],
  manager: DragDropManager,
  states: CharacterStateFormValue[],
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
  const others = states.flatMap((state) => {
    const element = elements.get(state._formId);
    return state._formId !== sourceId && element
      ? [{ id: state._formId, rect: element.getBoundingClientRect() }]
      : [];
  });

  const gap = findDropGap(others, shape?.current.center ?? position.current);
  return gap && { ...gap, sourceId };
}

/**
 * The gap nearest `point` among wrapped, LTR `items` in order, excluding the
 * dragged one. A line is chosen by height, split halfway between lines;
 * a lone item's gaps are above and below it, and gaps within a longer line
 * go by width. Points past either end fall to the nearest gap.
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

  let line = lines[0];
  for (const [i, next] of lines.entries()) {
    const prev = lines[i - 1];
    if (prev && point.y >= (prev.bottom + next.top) / 2) line = next;
  }
  if (!line) return null;

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
  states: CharacterStateFormValue[],
  slot: DropSlot,
): { fromIndex: number; toIndex: number } | null {
  const fromIndex = states.findIndex((s) => s._formId === slot.sourceId);
  if (fromIndex < 0 || slot.index === fromIndex) return null;
  // The gap's index already counts only the other items
  return { fromIndex, toIndex: slot.index };
}
