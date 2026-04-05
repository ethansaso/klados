import type { UIUnit } from "./types";

function shouldPreserveWord(word: string): boolean {
  // Keep original casing for: capital after first char (pH, McFly), all-caps (DNA),
  // or containing any non-letter character (digits, subscripts, superscripts, etc. — e.g. CO2, FeSO₄).
  const letters = word.replace(/[^a-zA-Z]/g, "");
  const allCaps = letters.length > 0 && letters === letters.toUpperCase();
  return /[A-Z]/.test(word.slice(1)) || allCaps || /[^a-zA-Z]/.test(word);
}

/** Apply word-by-word case normalization to a modifier value (e.g. "with FeSO₄"). */
export function formatModifierValue(
  value: string,
  capitalizeFirst = false,
): string {
  const normalized = value
    .split(/([ -])/)
    .map((token) =>
      token === " " || token === "-"
        ? token
        : shouldPreserveWord(token)
          ? token
          : token.toLowerCase(),
    )
    .join("");
  if (capitalizeFirst)
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  return normalized;
}

/** Format the literal label for a trait, accounting for prefixes and capitalization. */
export function formatTraitLabel(
  label: string,
  index: number,
  hasPrefixes: boolean,
) {
  // Split on spaces and hyphens (keeping delimiters), normalize each word,
  // then rejoin preserving the original separators.
  const normalized = label
    .split(/([ -])/)
    .map((token) =>
      token === " " || token === "-"
        ? token
        : shouldPreserveWord(token)
          ? token
          : token.toLowerCase(),
    )
    .join("");
  // When a prefix precedes the label it takes the capital; label stays lower.
  if (hasPrefixes) return normalized;
  if (index === 0)
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  return normalized;
}

/**
 * Group consecutive modifiers with the same groupId together.
 * Used to render same-group alternatives with "/" instead of a space.
 */
export function groupConsecutive<T extends { groupId: number }>(
  mods: T[],
): T[][] {
  return mods.reduce<T[][]>((acc, mod) => {
    const last = acc.at(-1);
    if (last && last[0]!.groupId === mod.groupId) {
      last.push(mod);
    } else {
      acc.push([mod]);
    }
    return acc;
  }, []);
}

/** Format a numeric value (or range string) with an optional unit symbol. */
export function formatWithUnit(
  value: number | string,
  unit: UIUnit | null,
): string {
  return unit ? `${value} ${unit.symbol}` : String(value);
}
