import { convertFromSI } from "../../lib/domain/units/utils";
import type {
  UICharacterState,
  UIModifier,
  UINumberState,
  UIRangeState,
  UIUnit,
} from "./types";

export const JOINER_TEXT: Record<UIModifier["joiner"], string> = {
  space: " ",
  slash: "/",
  comma: ", ",
};

function shouldPreserveWord(word: string): boolean {
  // Keep original casing for: capital after first char (pH, McFly), all-caps (DNA),
  // or containing any non-letter character (digits, subscripts, superscripts, etc. — e.g. CO2, FeSO₄).
  const letters = word.replace(/[^a-zA-Z]/g, "");
  const allCaps = letters.length > 0 && letters === letters.toUpperCase();
  return /[A-Z]/.test(word.slice(1)) || allCaps || /[^a-zA-Z]/.test(word);
}

/** Apply word-by-word case normalization to a modifier value (e.g. "with FeSO₄"). */
export function formatModifierLabel(
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

/** Format a numeric value (or range string) with an optional unit symbol. */
export function formatWithUnit(
  value: number | string,
  unit: UIUnit | null,
): string {
  return unit ? `${value} ${unit.symbol}` : String(value);
}

/** Value and unit copy for a numeric state, without modifiers. */
export function formatNumericCopy(state: UINumberState | UIRangeState): string {
  if (state.kind === "number") {
    const value = convertFromSI(state.siBaseValue, state.unit?.scale);
    return formatWithUnit(value, state.unit);
  }
  const min =
    state.siBaseMin !== null
      ? convertFromSI(state.siBaseMin, state.unit?.scale)
      : null;
  const max =
    state.siBaseMax !== null
      ? convertFromSI(state.siBaseMax, state.unit?.scale)
      : null;
  const rangeStr =
    min !== null && max !== null
      ? min === max
        ? `~${min}`
        : `${min}–${max}`
      : min !== null
        ? `≥ ${min}`
        : `≤ ${max}`;
  return formatWithUnit(rangeStr, state.unit);
}

export function getModifierSignature(state: UICharacterState): string {
  return (state.modifiers ?? [])
    .map((modifier) =>
      [modifier.id, modifier.affixType, modifier.joiner].join(":"),
    )
    .join("|");
}

/** Groups consecutive states that share identical, non-empty modifiers. */
export function collapseStatesByExactModifiers(states: UICharacterState[]) {
  return states.reduce<
    Array<{ states: UICharacterState[]; signature: string }>
  >((groups, state) => {
    const signature = getModifierSignature(state);
    const lastGroup = groups.at(-1);

    if (
      signature.length > 0 &&
      lastGroup &&
      lastGroup.signature === signature
    ) {
      lastGroup.states.push(state);
      return groups;
    }

    groups.push({ states: [state], signature });
    return groups;
  }, []);
}

/** Plain-text equivalent of `CharacterStateDisplay` with `forceLowercase`. */
export function formatCharacterStatesText(states: UICharacterState[]): string {
  const groups = collapseStatesByExactModifiers(states);
  return groups
    .map(({ states: groupStates }, groupIndex) => {
      const isLast = groupIndex === groups.length - 1;
      if (groupStates.length === 1) {
        return formatStateText(groupStates[0]!, isLast);
      }
      const values = groupStates
        .map((state) =>
          state.kind === "categorical"
            ? formatTraitLabel(state.trait.label, 1, false)
            : formatNumericCopy(state),
        )
        .join("/");
      return formatAffixedText(groupStates[0]!.modifiers ?? [], values, isLast);
    })
    .join(" ");
}

function formatStateText(state: UICharacterState, isLast: boolean): string {
  const modifiers = state.modifiers ?? [];
  const value =
    state.kind === "categorical"
      ? formatTraitLabel(
          state.trait.label,
          1,
          modifiers.some((m) => m.affixType === "prefix"),
        )
      : formatNumericCopy(state);
  return formatAffixedText(modifiers, value, isLast);
}

/** Plain-text equivalent of `AffixedValue` with `lowercaseFirst`. */
function formatAffixedText(
  modifiers: UIModifier[],
  value: string,
  isLast: boolean,
): string {
  const prefixes = modifiers
    .filter((m) => m.affixType === "prefix")
    .map(
      (m, i) =>
        (i > 0 ? JOINER_TEXT[m.joiner] : "") + formatModifierLabel(m.label),
    )
    .join("");
  const suffixes = modifiers
    .filter((m) => m.affixType === "suffix")
    .map((m) => JOINER_TEXT[m.joiner] + formatModifierLabel(m.label))
    .join("");
  return `${prefixes ? `${prefixes} ` : ""}${value}${suffixes}${isLast ? "" : ","}`;
}
