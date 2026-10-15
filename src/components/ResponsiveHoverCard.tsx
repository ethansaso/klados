import { Popover } from "@radix-ui/themes";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

type ContentProps = Omit<
  ComponentPropsWithoutRef<typeof Popover.Content>,
  "children"
>;

interface Props {
  /** A single element, e.g. the underlined term. */
  children: ReactNode;
  content: ReactNode;
  contentProps?: ContentProps;
  onOpenChange?: (open: boolean) => void;
}

// Radix HoverCard's defaults
const OPEN_DELAY = 700;
const CLOSE_DELAY = 300;

/**
 * A hover card that also works on mobile via tap.
 * * Mouse: opens on hover after a delay; a click pins it open until dismissed.
 * * Touch and keyboard: tap, Enter, or Space toggles it. Scroll won't trigger.
 */
export const ResponsiveHoverCard = ({
  children,
  content,
  contentProps,
  onOpenChange,
}: Props) => {
  const [open, setOpen] = useState(false);
  const pinnedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pointerTypeRef = useRef<string | null>(null);

  const clearTimer = useCallback(() => clearTimeout(timerRef.current), []);

  const updateOpen = useCallback(
    (next: boolean) => {
      clearTimer();
      if (!next) pinnedRef.current = false;
      setOpen(next);
      onOpenChange?.(next);
    },
    [clearTimer, onOpenChange],
  );

  const updateOpenAfter = useCallback(
    (next: boolean, delay: number) => {
      clearTimer();
      timerRef.current = setTimeout(() => updateOpen(next), delay);
    },
    [clearTimer, updateOpen],
  );

  useEffect(() => clearTimer, [clearTimer]);

  const handleHoverStart = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    if (open) clearTimer();
    else updateOpenAfter(true, OPEN_DELAY);
  };

  const handleHoverEnd = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || pinnedRef.current) return;
    if (open) updateOpenAfter(false, CLOSE_DELAY);
    else clearTimer();
  };

  const handleClick = (e: React.MouseEvent) => {
    // Replaces Radix's own toggle
    e.preventDefault();
    const pointerType = pointerTypeRef.current;
    pointerTypeRef.current = null;

    if (pointerType === "mouse" && !pinnedRef.current) {
      pinnedRef.current = true;
      updateOpen(true);
    } else {
      updateOpen(!open);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    updateOpen(!open);
  };

  return (
    <Popover.Root open={open} onOpenChange={updateOpen}>
      <Popover.Trigger
        // The trigger is usually a span in running text
        role="button"
        tabIndex={0}
        onPointerDown={(e) => (pointerTypeRef.current = e.pointerType)}
        onPointerEnter={handleHoverStart}
        onPointerLeave={handleHoverEnd}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {children}
      </Popover.Trigger>
      <Popover.Content
        {...contentProps}
        onPointerEnter={handleHoverStart}
        onPointerLeave={handleHoverEnd}
        // Hover shouldn't move focus, so there is none to move or restore
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {content}
      </Popover.Content>
    </Popover.Root>
  );
};
