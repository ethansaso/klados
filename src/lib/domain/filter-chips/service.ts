import { type CharacterStateFilterToken } from "../taxa/search";
import { characterTokenKey } from "../taxa/utils";
import { selectCharacterFilterLabels } from "./repo";
import type { CharacterFilterChip } from "./types";

/**
 * Describe filter tokens for display, e.g. "Cap · Diameter: 5 cm".
 * Marks token null (undescribable) whenever any id it names is gone
 */
export async function resolveCharacterFilterChips(
  tokens: CharacterStateFilterToken[],
): Promise<CharacterFilterChip[]> {
  if (!tokens.length) return [];

  const labels = await selectCharacterFilterLabels({
    featureIds: tokens.map((token) => token.f).filter((id) => id !== undefined),
    characterIds: tokens.map((token) => token.c),
    traitValueIds: tokens
      .filter((token) => token.k === "c")
      .map((token) => token.t),
    unitIds: tokens
      .filter((token) => token.k === "n")
      .map((token) => token.u)
      .filter((id) => id !== undefined),
  });

  return tokens.map((token) => {
    const key = characterTokenKey(token);
    const characterLabel = labels.characters.get(token.c);
    const featureLabel =
      token.f === undefined ? null : labels.features.get(token.f);

    if (characterLabel === undefined || featureLabel === undefined) {
      return { key, label: null };
    }

    const prefix = featureLabel === null ? "" : `${featureLabel} > `;

    if (token.k === "c") {
      const value = labels.traitValues.get(token.t);

      // A value belonging to another character (e.g. "gill attachment: red")
      // can never match a state row, since the FK forbids that pairing.
      if (value === undefined || value.characterId !== token.c) {
        return { key, label: null };
      }
      return { key, label: `${prefix}${characterLabel}: ${value.label}` };
    }

    if (token.u === undefined) {
      return { key, label: `${prefix}${characterLabel}: ${token.v}` };
    }

    const symbol = labels.units.get(token.u);
    if (symbol === undefined) return { key, label: null };
    return { key, label: `${prefix}${characterLabel}: ${token.v} ${symbol}` };
  });
}
