import { Badge, Flex, IconButton, Popover } from "@radix-ui/themes";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { PiX } from "react-icons/pi";
import type { ModifierTokenFormValue } from "../validation";
import { ModifierPopoverContent } from "./ModifierPopoverContent";

type ModifierTagProps = {
  children: ReactNode;
  modifiers: ModifierTokenFormValue[];
  onRemove: () => void;
  onModifiersChange: (mods: ModifierTokenFormValue[]) => void;
  /** When true, immediately opens the modifier popover. */
  autoOpen?: boolean;
  /** Called when the popover closes after an auto-open (so parent can reset). */
  onAutoOpenHandled?: () => void;
};

/**
 * A state tag (badge) that opens a Radix Popover for inline modifier editing.
 */
export function ModifierTag({
  children,
  modifiers,
  onRemove,
  onModifiersChange,
  autoOpen,
  onAutoOpenHandled,
}: ModifierTagProps) {
  const [open, setOpen] = useState(false);
  const filterInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoOpen) setOpen(true);
  }, [autoOpen]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) onAutoOpenHandled?.();
  };

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Flex display="inline-flex" position="relative">
        <Popover.Trigger>
          <Badge
            variant="outline"
            color="gray"
            className="modifier-tag"
            data-has-modifiers={modifiers.length > 0 || undefined}
            asChild
          >
            <button type="button">{children}</button>
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
        width="240px"
        size="1"
        className="modifier-tag__popover"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          filterInputRef.current?.focus();
        }}
      >
        <ModifierPopoverContent
          modifiers={modifiers}
          filterInputRef={filterInputRef}
          onAdd={(m) => onModifiersChange([...modifiers, m])}
          onRemove={(id) =>
            onModifiersChange(modifiers.filter((m) => m.id !== id))
          }
        />
      </Popover.Content>
    </Popover.Root>
  );
}
