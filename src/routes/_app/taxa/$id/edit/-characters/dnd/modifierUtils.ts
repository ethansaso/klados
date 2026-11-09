import {
  MODIFIER_JOINERS,
  type AffixType,
} from "../../../../../../../../db/schema/schema";
import type { ModifierTokenFormValue } from "../validation";

/** Prefixes, then suffixes, each in stored order: the editor's layout. */
export function inDisplayOrder(
  modifiers: ModifierTokenFormValue[],
): ModifierTokenFormValue[] {
  return [
    ...modifiers.filter((m) => m.affixType === "prefix"),
    ...modifiers.filter((m) => m.affixType === "suffix"),
  ];
}

/**
 * Moves a modifier within display order and onto `affixType`'s side.
 * Its joiner resets, since it no longer follows the same token.
 */
export function moveModifier(
  modifiers: ModifierTokenFormValue[],
  fromIndex: number,
  toIndex: number,
  affixType: AffixType,
): ModifierTokenFormValue[] {
  const next = inDisplayOrder(modifiers);
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) return modifiers;
  next.splice(toIndex, 0, { ...moved, affixType, joiner: "space" });
  return inDisplayOrder(next);
}

/** Advances a modifier's joiner to the next option, wrapping around. */
export function cycleModifierJoiner(
  modifiers: ModifierTokenFormValue[],
  id: number,
): ModifierTokenFormValue[] {
  return modifiers.map((m) => {
    if (m.id !== id) return m;
    const next = MODIFIER_JOINERS.indexOf(m.joiner) + 1;
    return { ...m, joiner: MODIFIER_JOINERS[next % MODIFIER_JOINERS.length]! };
  });
}
