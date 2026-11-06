import { Text } from "@radix-ui/themes";
import { useRef, useState } from "react";
import {
  type ReadablePhoto,
  readableMediaUrl,
  readPhoto,
  samplePhoto,
} from "../sampling/imageSampling";
import type { ColorPick, ColorSample, PickerPhoto } from "../types";
import { Loupe } from "./Loupe";
import "./PhotoStage.css";

type Props = {
  photo: PickerPhoto;
  alt: string;
  /** Picks on this photo. */
  picks: ColorPick[];
  highlightedPickId: number | null;
  onAdd: (x: number, y: number, sample: ColorSample) => void;
  onMove: (pickId: number, x: number, y: number) => void;
  onMoveEnd: (pickId: number, sample: ColorSample) => void;
};

type Point = { x: number; y: number };

type LoupeTarget = Point & {
  image: HTMLImageElement;
  anchor: { left: number; top: number };
};

/**
 * Provides photo sampling: click to pick, drag pin to move.
 * ! Must be re-keyed between photo switches.
 */
export function PhotoStage({
  photo,
  alt,
  picks,
  highlightedPickId,
  onAdd,
  onMove,
  onMoveEnd,
}: Props) {
  const [readable, setReadable] = useState<ReadablePhoto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loupe, setLoupe] = useState<LoupeTarget | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const frameRef = useRef(0);
  const dragRef = useRef<{ pickId: number; at: Point | null } | null>(null);

  const handleLoad = () => {
    try {
      setReadable(readPhoto(imageRef.current!));
    } catch {
      setError(
        "This photo's colors can't be read. Its image server needs to allow it.",
      );
    }
  };

  // Throttled to a frame, since the loupe samples and redraws
  const showLoupe = (e: React.PointerEvent) => {
    const image = imageRef.current!;
    const stage = stageRef.current!.getBoundingClientRect();
    const target = {
      image,
      ...pixelAt(image, e),
      anchor: { left: e.clientX - stage.left, top: e.clientY - stage.top },
    };
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => setLoupe(target));
  };

  const hideLoupe = () => {
    cancelAnimationFrame(frameRef.current);
    setLoupe(null);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!readable) return;
    const { x, y } = pixelAt(imageRef.current!, e);
    onAdd(x, y, samplePhoto(readable, x, y));
  };

  const handlePinDown = (e: React.PointerEvent, pickId: number) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { pickId, at: null };
  };

  const handlePinMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    drag.at = pixelAt(imageRef.current!, e);
    onMove(drag.pickId, drag.at.x, drag.at.y);
    showLoupe(e);
  };

  const handlePinUp = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    hideLoupe();
    if (drag?.at && readable) {
      onMoveEnd(drag.pickId, samplePhoto(readable, drag.at.x, drag.at.y));
    }
  };

  return (
    <div className="photo-stage" ref={stageRef}>
      <div className="photo-stage__frame">
        <img
          ref={imageRef}
          src={readableMediaUrl(photo.storageKey)}
          crossOrigin="anonymous"
          alt={alt}
          className="photo-stage__image"
          draggable={false}
          onLoad={handleLoad}
          onError={() => setError("This photo couldn't be loaded.")}
          onClick={handleClick}
          onPointerMove={(e) => {
            if (e.pointerType !== "touch") showLoupe(e);
          }}
          onPointerLeave={hideLoupe}
        />
        {readable &&
          picks.map((pick) => (
            <span
              key={pick.id}
              className="photo-stage__pin"
              data-highlighted={pick.id === highlightedPickId}
              style={{
                left: `${(pick.x / readable.pixels.width) * 100}%`,
                top: `${(pick.y / readable.pixels.height) * 100}%`,
                backgroundColor: pick.swatch.hexCode,
              }}
              onPointerDown={(e) => handlePinDown(e, pick.id)}
              onPointerMove={handlePinMove}
              onPointerUp={handlePinUp}
              onPointerCancel={handlePinUp}
            />
          ))}
      </div>
      {error && (
        <Text as="p" size="2" color="red" className="photo-stage__error">
          {error}
        </Text>
      )}
      {loupe && readable && <Loupe photo={readable} {...loupe} />}
    </div>
  );
}

/** The photo pixel under the pointer, clamped to the photo. */
function pixelAt(image: HTMLImageElement, e: React.MouseEvent): Point {
  const rect = image.getBoundingClientRect();
  const clamp = (value: number, size: number) =>
    Math.max(0, Math.min(size - 1, Math.floor(value)));
  return {
    x: clamp(
      ((e.clientX - rect.left) / rect.width) * image.naturalWidth,
      image.naturalWidth,
    ),
    y: clamp(
      ((e.clientY - rect.top) / rect.height) * image.naturalHeight,
      image.naturalHeight,
    ),
  };
}
