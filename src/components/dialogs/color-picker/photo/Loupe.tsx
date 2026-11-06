import { Flex, Text } from "@radix-ui/themes";
import { useLayoutEffect, useRef } from "react";
import { type ReadablePhoto, sampleDisc } from "../sampling/imageSampling";
import { rankPaletteColors } from "../sampling/nearestPaletteColor";
import "./Loupe.css";

type Props = {
  image: HTMLImageElement;
  photo: ReadablePhoto;
  // Sample points in the photo's natural pixels.
  x: number;
  y: number;
  /** Pointer position within the loupe's positioned parent. */
  anchor: { left: number; top: number };
};

/** Gap between the pointer and the loupe. */
const POINTER_GAP = 16;
/** The zoom shows this many sample radii across, but never fewer pixels than the minimum. */
const ZOOM_SPAN_RADII = 7;
const MIN_ZOOM_SPAN = 37;

/** A close-up beside the pointer and the color the sample there reads as. */
export function Loupe({ image, photo, x, y, anchor }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nearest] = rankPaletteColors(sampleDisc(photo, x, y), photo.exposure);

  useLayoutEffect(() => {
    const root = rootRef.current!;
    const bounds = root.offsetParent as HTMLElement;
    const { offsetWidth: width, offsetHeight: height } = root;
    // Right of pointer unless it'd run off the edge; centered on it vertically
    const left =
      anchor.left + POINTER_GAP + width > bounds.clientWidth
        ? anchor.left - POINTER_GAP - width
        : anchor.left + POINTER_GAP;
    const top = Math.min(bounds.clientHeight - height, anchor.top - height / 2);
    root.style.left = `${Math.max(0, left)}px`;
    root.style.top = `${Math.max(0, top)}px`;
    drawZoom(canvasRef.current!, image, photo, x, y);
  });

  return (
    <div ref={rootRef} className="color-loupe">
      <canvas ref={canvasRef} className="color-loupe__zoom" />
      <Flex align="center" gap="2" px="2" py="1">
        <span
          className="color-loupe__dot"
          style={{ backgroundColor: nearest!.hexCode }}
        />
        <Text size="2" weight="medium">
          {nearest!.label}
        </Text>
      </Flex>
    </div>
  );
}

/** Pixelated close-up around the sample, with the sample disc outlined. */
function drawZoom(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  photo: ReadablePhoto,
  x: number,
  y: number,
) {
  // Match the bitmap to the size CSS gives the canvas.
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  const { width, height } = canvas;
  const spanX = Math.max(MIN_ZOOM_SPAN, photo.radius * ZOOM_SPAN_RADII);
  const spanY = (spanX * height) / width;

  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    image,
    x - spanX / 2,
    y - spanY / 2,
    spanX,
    spanY,
    0,
    0,
    width,
    height,
  );
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(
    width / 2,
    height / 2,
    (photo.radius * width) / spanX,
    0,
    2 * Math.PI,
  );
  ctx.stroke();
}
