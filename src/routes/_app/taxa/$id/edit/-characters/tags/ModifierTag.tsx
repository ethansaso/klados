import { Badge, Flex, IconButton, Popover } from "@radix-ui/themes";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { PiX } from "react-icons/pi";
import type { SampleModifier } from "../sampleModifiers";
import { ModifierPopoverContent } from "./ModifierPopoverContent";

type ModifierTagProps = {
  children: ReactNode;
  modifiers: SampleModifier[];
  onRemove: () => void;
  onModifiersChange: (mods: SampleModifier[]) => void;
};

/**
 * A state tag (badge) that opens a Radix Popover for inline modifier editing.
 */
export function ModifierTag({
  children,
  modifiers,
  onRemove,
  onModifiersChange,
}: ModifierTagProps) {
  const [open, setOpen] = useState(false);
  const [filterQ, setFilterQ] = useState("");
  const filterInputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = (next: boolean) => {
    if (!next) setFilterQ("");
    setOpen(next);
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
          filterQ={filterQ}
          filterInputRef={filterInputRef}
          onFilterChange={setFilterQ}
          onAdd={(m) => onModifiersChange([...modifiers, m])}
          onRemove={(id) =>
            onModifiersChange(modifiers.filter((m) => m.id !== id))
          }
        />
      </Popover.Content>
    </Popover.Root>
  );
}
