import "./MediaLightbox.css";

import NiceModal from "@ebay/nice-modal-react";
import { IconButton, Theme, VisuallyHidden } from "@radix-ui/themes";
import { Dialog } from "radix-ui";
import {
  type KeyboardEvent,
  type MouseEvent,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { PiCaretLeft, PiCaretRight, PiX } from "react-icons/pi";
import type { MediaDTO } from "../../lib/domain/media/types";
import { getMediaUrl } from "../../lib/storage/getMediaUrl";
import { mediaVariantDimensions } from "../../lib/storage/mediaSizes";
import { AnnotationBubbleWrap } from "../annotations/AnnotationBubbleWrap";
import { MediaImage } from "../MediaImage";

type Props = {
  media: MediaDTO[];
  startIndex: number;
  /** Alt text. */
  label: string;
  /** The opener's already-loaded file for the first photo, shown while it loads. */
  startPlaceholderSrc?: string;
};

/** Where a click landed, so zooming in keeps that point under the pointer. */
type ZoomOrigin = {
  /** Click position as a fraction of the fitted image's size. */
  fx: number;
  fy: number;
  clientX: number;
  clientY: number;
  /** Mice pan by pointer position, so they start where that would put them. */
  byMouse: boolean;
  /** The fitted image's file, shown while `full` loads. */
  placeholderSrc: string;
};

const MediaLightbox = NiceModal.create<Props>(
  ({ media, startIndex, label, startPlaceholderSrc }) => {
    const { visible, remove, resolve } = NiceModal.useModal();
    const [index, setIndex] = useState(startIndex);
    const [canZoom, setCanZoom] = useState(false);
    const [zoom, setZoom] = useState<ZoomOrigin | null>(null);
    const zoomRef = useRef<HTMLDivElement>(null);
    const pointerTypeRef = useRef("mouse");

    const item = media[index]!;
    const full = mediaVariantDimensions(item, "full");
    const hasPrev = index > 0;
    const hasNext = index < media.length - 1;

    const close = () => {
      resolve();
      remove();
    };

    const go = (delta: number) => {
      setIndex((i) => i + delta);
      setCanZoom(false);
      setZoom(null);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft" && hasPrev) go(-1);
      if (e.key === "ArrowRight" && hasNext) go(1);
    };

    const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) close();
    };

    // Mice start where panning would put them so first move doesn't jump.
    // Taps get the slightly nicer UX of zooming tapped point to same position under finger.
    useLayoutEffect(() => {
      const container = zoomRef.current;
      const image = container?.firstElementChild as HTMLElement | null;
      if (!zoom || !container || !image) return;
      if (zoom.byMouse) {
        panToPointer(container, zoom.clientX, zoom.clientY);
        return;
      }
      container.scrollLeft =
        image.offsetLeft + zoom.fx * full.width - zoom.clientX;
      container.scrollTop =
        image.offsetTop + zoom.fy * full.height - zoom.clientY;
    }, [zoom, full.width, full.height]);

    return (
      <Dialog.Root open={visible} onOpenChange={(open) => !open && close()}>
        <Dialog.Portal>
          <Theme appearance="dark" hasBackground={false}>
            <Dialog.Overlay className="media-lightbox__overlay" />
            <Dialog.Content
              className="media-lightbox"
              aria-describedby={undefined}
              onEscapeKeyDown={(e) => {
                if (!zoom) return;
                e.preventDefault();
                setZoom(null);
              }}
              onKeyDown={handleKeyDown}
              onClick={handleBackdropClick}
            >
              <VisuallyHidden>
                <Dialog.Title>
                  {label}, photo {index + 1} of {media.length}
                </Dialog.Title>
              </VisuallyHidden>

              {zoom ? (
                <div
                  ref={zoomRef}
                  className="media-lightbox__zoom"
                  onPointerMove={(e) => {
                    // Mice pan by position; touch scrolls natively.
                    if (e.pointerType !== "mouse") return;
                    panToPointer(e.currentTarget, e.clientX, e.clientY);
                  }}
                >
                  <img
                    className="media-lightbox__zoomed-image"
                    src={getMediaUrl(item, "full")}
                    alt={`${label}, copyright ${item.owner}`}
                    width={full.width}
                    height={full.height}
                    style={{
                      backgroundImage: `url("${zoom.placeholderSrc}")`,
                    }}
                    onLoad={(e) => {
                      e.currentTarget.style.backgroundImage = "none";
                    }}
                    onClick={() => setZoom(null)}
                  />
                </div>
              ) : (
                <div className="media-lightbox__frame">
                  <AnnotationBubbleWrap media={item} spacing="2">
                    <MediaImage
                      key={item.storageKey}
                      className="media-lightbox__image"
                      data-zoomable={canZoom || undefined}
                      media={item}
                      sizes="100vw"
                      alt={`${label}, copyright ${item.owner}`}
                      // ! Sized up-front so placeholder isn't hidden.
                      // Contained in the fit box, never past its own size.
                      style={{
                        width: `min(var(--fit-width), ${full.width}px, calc(var(--fit-height) * ${full.width / full.height}))`,
                        aspectRatio: `${full.width} / ${full.height}`,
                      }}
                      placeholderSrc={
                        index === startIndex && startPlaceholderSrc
                          ? startPlaceholderSrc
                          : getMediaUrl(item, "small")
                      }
                      onLoad={(e) => {
                        const shown = e.currentTarget.getBoundingClientRect();
                        setCanZoom(full.width > shown.width + 1);
                      }}
                      onPointerDown={(e) => {
                        pointerTypeRef.current = e.pointerType;
                      }}
                      onClick={(e) => {
                        if (!canZoom) return;
                        const shown = e.currentTarget.getBoundingClientRect();
                        setZoom({
                          fx: (e.clientX - shown.left) / shown.width,
                          fy: (e.clientY - shown.top) / shown.height,
                          clientX: e.clientX,
                          clientY: e.clientY,
                          byMouse: pointerTypeRef.current === "mouse",
                          placeholderSrc: e.currentTarget.currentSrc,
                        });
                      }}
                    />
                  </AnnotationBubbleWrap>
                </div>
              )}

              {hasPrev && (
                <IconButton
                  className="media-lightbox__arrow media-lightbox__arrow--prev"
                  variant="ghost"
                  color="gray"
                  highContrast
                  size="4"
                  aria-label="Previous photo"
                  onClick={() => go(-1)}
                >
                  <PiCaretLeft size={32} />
                </IconButton>
              )}
              {hasNext && (
                <IconButton
                  className="media-lightbox__arrow media-lightbox__arrow--next"
                  variant="ghost"
                  color="gray"
                  highContrast
                  size="4"
                  aria-label="Next photo"
                  onClick={() => go(1)}
                >
                  <PiCaretRight size={32} />
                </IconButton>
              )}
              <Dialog.Close asChild>
                <IconButton
                  className="media-lightbox__close"
                  variant="ghost"
                  color="gray"
                  highContrast
                  size="3"
                  aria-label="Close"
                >
                  <PiX size={24} />
                </IconButton>
              </Dialog.Close>
            </Dialog.Content>
          </Theme>
        </Dialog.Portal>
      </Dialog.Root>
    );
  },
);

/** Uses proportional zoom to avoid jump between clicked position and first cursor movement. */
function panToPointer(el: HTMLElement, clientX: number, clientY: number) {
  el.scrollLeft =
    (clientX / el.clientWidth) * (el.scrollWidth - el.clientWidth);
  el.scrollTop =
    (clientY / el.clientHeight) * (el.scrollHeight - el.clientHeight);
}

export function viewMediaFullscreen(props: Props): Promise<void> {
  return NiceModal.show(MediaLightbox, props).then(() => undefined);
}
