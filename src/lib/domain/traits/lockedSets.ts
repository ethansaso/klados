import { buildColorPalette, COLOR_CHARACTER_LABEL } from "./colorPalette";

/**
 * Canonical labels of every character with locked sets, keyed by character
 * label. Labels of such characters can't be renamed, so the key is stable.
 * TODO: key by character key once characters have one.
 */
const CANONICAL_LABELS_BY_CHARACTER = new Map<string, ReadonlySet<string>>([
  [
    COLOR_CHARACTER_LABEL.toLowerCase(),
    new Set(buildColorPalette().map((color) => color.label)),
  ],
]);

/**
 * Canonical labels (lowercase) for a character with locked sets.
 * Throws when none are defined, so a missing entry never leaves a locked
 * character's canonical labels unprotected.
 */
export function canonicalLabelsFor(
  characterLabel: string,
): ReadonlySet<string> {
  const labels = CANONICAL_LABELS_BY_CHARACTER.get(
    characterLabel.toLowerCase(),
  );

  if (!labels) {
    throw new Error(
      `"${characterLabel}" has locked sets, but no canonical labels are defined for it.`,
    );
  }

  return labels;
}
