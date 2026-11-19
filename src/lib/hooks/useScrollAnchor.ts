import { useMatch } from "@tanstack/react-router";
import { type MouseEvent, useLayoutEffect, useRef } from "react";

type PendingAnchor = { pathname: string; top: number };

/** Keyed by anchor, declared module-level to persist between page loads */
const pendingAnchors = new Map<string, PendingAnchor>();

/**
 * Keeps an element at the same viewport offset across a link navigation, e.g.
 * a section that also renders on the destination page.
 *
 * Attach `ref` to the element and spread `linkProps` onto router links.
 */
export function useScrollAnchor<T extends HTMLElement>(key: string) {
  const ref = useRef<T>(null);
  // Changes in the same commit as the destination's content. The location updates
  // when navigation starts, and `onRendered` can fire before nested routes commit.
  const pathname = useMatch({
    strict: false,
    select: (match) => normalizePathname(match.pathname),
  });

  useLayoutEffect(() => {
    const pending = pendingAnchors.get(key);
    if (!pending) return;
    pendingAnchors.delete(key);
    const element = ref.current;
    if (!element || pending.pathname !== pathname) return;

    window.scrollBy({
      top: element.getBoundingClientRect().top - pending.top,
      behavior: "instant",
    });
  }, [key, pathname]);

  const linkProps = {
    resetScroll: false,
    onClick(e: MouseEvent<HTMLAnchorElement>) {
      const element = ref.current;
      // Modified clicks open elsewhere and leave this page as is.
      if (!element || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) {
        return;
      }
      pendingAnchors.set(key, {
        pathname: normalizePathname(
          decodeURI(new URL(e.currentTarget.href).pathname),
        ),
        top: element.getBoundingClientRect().top,
      });
    },
  };

  return { ref, linkProps };
}

/** Match pathnames are decoded and may end in "/" for index routes. */
function normalizePathname(pathname: string) {
  return pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
}
