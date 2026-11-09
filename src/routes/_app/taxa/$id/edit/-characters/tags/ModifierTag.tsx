import { useSortable } from "@dnd-kit/react/sortable";
import { Badge, Flex, IconButton, Popover } from "@radix-ui/themes";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { PiX } from "react-icons/pi";
import { REORDER_SORTABLE_PLUGINS, type DropGap } from "../dnd/useListReorder";
import type { ModifierTokenFormValue } from "../validation";
import { ModifierPopoverContent } from "./ModifierPopoverContent";

type ModifierTagProps = {
  id: string;
  index: number;
  children: ReactNode;
  /** The state's value alone, for the modifier editor. */
  value: ReactNode;
  modifiers: ModifierTokenFormValue[];
  onRemove: () => void;
  onModifiersChange: (mods: ModifierTokenFormValue[]) => void;
  /** When true, immediately opens the modifier popover. */
  autoOpen?: boolean;
  /** Called when the popover closes after an auto-open (so parent can reset). */
  onAutoOpenHandled?: () => void;
  /** Called when the user presses Escape inside the popover, to return to the main input. */
  onReturnToSearch?: () => void;
  /** Where to show the drop marker while another tag is dragged. */
  dropMarker?: Pick<DropGap, "side" | "axis">;
};

/**
 * A sortable state tag (badge) that opens a Radix Popover for inline modifier
 * editing.
 */
export function ModifierTag({
  id,
  index,
  children,
  value,
  modifiers,
  onRemove,
  onModifiersChange,
  autoOpen,
  onAutoOpenHandled,
  onReturnToSearch,
  dropMarker,
}: ModifierTagProps) {
  const [open, setOpen] = useState(false);
  const filterInputRef = useRef<HTMLInputElement>(null);
  // Drags start from the badge; the sensor ignores other buttons, like remove
  const { ref, handleRef } = useSortable({
    id,
    index,
    plugins: REORDER_SORTABLE_PLUGINS,
    transition: null,
  });

  useEffect(() => {
    if (autoOpen) setOpen(true);
  }, [autoOpen]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) onAutoOpenHandled?.();
  };

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Flex
        ref={ref}
        display="inline-flex"
        position="relative"
        className="reorder-item"
        data-drop-side={dropMarker?.side}
        data-drop-axis={dropMarker?.axis}
      >
        <Popover.Trigger>
          <Badge
            variant="outline"
            color="gray"
            className="modifier-tag"
            data-has-modifiers={modifiers.length > 0 || undefined}
            asChild
          >
            <button ref={handleRef} type="button">
              {children}
            </button>
          </Badge>
        </Popover.Trigger>
        <IconButton
          type="button"
          size="1"
          variant="ghost"
          color="tomato"
          className="modifier-tag__remove"
          onClick={onRemove}
          style={{ padding: "calc(var(--space-1) / 2)" }}
        >
          <PiX size={12} />
        </IconButton>
      </Flex>
      <Popover.Content
        side="bottom"
        align="start"
        width="320px"
        size="1"
        className="modifier-tag__popover"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          filterInputRef.current?.focus();
        }}
        onEscapeKeyDown={(e) => {
          if (!onReturnToSearch) return;
          e.preventDefault();
          handleOpenChange(false);
          onReturnToSearch();
        }}
      >
        <ModifierPopoverContent
          modifiers={modifiers}
          value={value}
          filterInputRef={filterInputRef}
          onChange={onModifiersChange}
        />
      </Popover.Content>
    </Popover.Root>
  );
}
