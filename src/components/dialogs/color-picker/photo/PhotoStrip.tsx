import { getMediaUrl } from "../../../../lib/storage/getMediaUrl";
import { NumberBubble } from "../../../NumberBubble";
import "./PhotoStrip.css";
import type { ColorPick, PickerPhoto } from "../types";

type Props = {
  media: PickerPhoto[];
  selectedIndex: number;
  picks: ColorPick[];
  onSelect: (index: number) => void;
};

/** Thumbnails of every photo, each marked with the numbers of its picks. */
export function PhotoStrip({ media, selectedIndex, picks, onSelect }: Props) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = (selectedIndex + step + media.length) % media.length;
    onSelect(next);
    (e.currentTarget.children[next] as HTMLElement).focus();
  };

  return (
    <div className="photo-strip" onKeyDown={handleKeyDown}>
      {media.map((photo, i) => (
        <button
          key={photo.id}
          type="button"
          className="photo-strip__item"
          aria-label={`Photo ${i + 1} of ${media.length}`}
          aria-pressed={i === selectedIndex}
          onClick={() => onSelect(i)}
        >
          <img src={getMediaUrl(photo.storageKey)} alt="" />
          <span className="photo-strip__picks">
            {picks.map(
              (pick, n) =>
                pick.mediaId === photo.id && (
                  <NumberBubble key={pick.id}>{n + 1}</NumberBubble>
                ),
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
