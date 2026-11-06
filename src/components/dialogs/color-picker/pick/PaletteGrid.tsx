import { Tooltip } from "@radix-ui/themes";
import {
  BASE_HUES,
  NEUTRALS,
  SHADES,
  shadeHex,
  shadeLabel,
} from "../../../../lib/domain/traits/colorPalette";
import type { PaletteSwatch } from "../sampling/nearestPaletteColor";
import "./PaletteGrid.css";
import { TakenWarning } from "./TakenWarning";

type Props = {
  sampledHex: string;
  selectedHex: string;
  takenReason: (hexCode: string) => string | null;
  onSelect: (swatch: PaletteSwatch) => void;
};

/** Shades down, hues across. */
const HUE_ROWS: PaletteSwatch[][] = SHADES.map((shade) =>
  BASE_HUES.map((hue) => ({
    label: shadeLabel(hue, shade),
    hexCode: shadeHex(hue, shade).toLowerCase(),
  })),
);
const NEUTRAL_ROW: PaletteSwatch[] = NEUTRALS.map(({ name, hex }) => ({
  label: name,
  hexCode: hex.toLowerCase(),
}));

/**
 * Every swatch over the sampled color, so each can be judged against it.
 * Floods background with `sampledHex`.
 */
export function PaletteGrid({
  sampledHex,
  selectedHex,
  takenReason,
  onSelect,
}: Props) {
  const cell = (swatch: PaletteSwatch) => {
    const reason = takenReason(swatch.hexCode);
    return (
      <Tooltip
        key={swatch.label}
        delayDuration={0}
        disableHoverableContent
        className="palette-grid__tooltip"
        content={
          reason ? `${swatch.label} [${reason.toLowerCase()}]` : swatch.label
        }
      >
        <button
          type="button"
          role="radio"
          aria-checked={swatch.hexCode === selectedHex}
          aria-label={swatch.label}
          className="palette-grid__cell"
          style={{ backgroundColor: swatch.hexCode }}
          onClick={() => onSelect(swatch)}
        >
          {reason && <TakenWarning className="palette-grid__warning" />}
        </button>
      </Tooltip>
    );
  };

  return (
    <div
      className="palette-grid"
      style={
        {
          backgroundColor: sampledHex,
          "--palette-columns": BASE_HUES.length,
        } as React.CSSProperties
      }
      role="radiogroup"
      aria-label="All colors"
    >
      <div className="palette-grid__rows">{HUE_ROWS.flat().map(cell)}</div>
      <div className="palette-grid__rows">{NEUTRAL_ROW.map(cell)}</div>
    </div>
  );
}
