import { Box, Tooltip } from "@radix-ui/themes";
import type { ComponentPropsWithoutRef } from "react";
import { useCallback, useRef, useState } from "react";

type TooltipProps = ComponentPropsWithoutRef<typeof Tooltip>;

/** Movement in px beyond which a touch gesture is treated as a scroll, not a tap. */
const SCROLL_THRESHOLD = 10;

/**
 * A Radix Tooltip that also works on mobile via tap, with a scroll guard.
 *
 * Uses Radix' interactivity on desktop.
 * On touch devices:
 *  - pointerdown records start position but doesn't open yet.
 *  - pointermove cancels if the finger travels more than SCROLL_THRESHOLD px.
 *  - pointerup fires the toggle only if it wasn't a scroll.
 *
 * The 600ms `touchBlockRef` guard prevents simulated pointer-hover events
 * (fired by mobile browsers after a touch sequence) from fighting the
 * manually-controlled open state.
 */
export const ResponsiveTooltip = ({ children, ...props }: TooltipProps) => {
  const [open, setOpen] = useState(false);
  const touchBlockRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const scrollCancelledRef = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== "touch") return;
    touchStartRef.current = { x: e.clientX, y: e.clientY };
    scrollCancelledRef.current = false;
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== "touch" || !touchStartRef.current) return;
    const dx = e.clientX - touchStartRef.current.x;
    const dy = e.clientY - touchStartRef.current.y;
    if (Math.sqrt(dx * dx + dy * dy) > SCROLL_THRESHOLD) {
      scrollCancelledRef.current = true;
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== "touch") return;
    touchStartRef.current = null;
    if (scrollCancelledRef.current) return;

    touchBlockRef.current = true;
    setTimeout(() => {
      touchBlockRef.current = false;
    }, 600);
    setOpen((prev) => !prev);
  }, []);

  const handleOpenChange = useCallback((next: boolean) => {
    if (touchBlockRef.current) return;
    setOpen(next);
  }, []);

  return (
    <Tooltip open={open} onOpenChange={handleOpenChange} {...props}>
      {/* The span is the Radix trigger anchor; pointer handlers intercept touch taps */}
      <Box
        asChild
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {children}
      </Box>
    </Tooltip>
  );
};
