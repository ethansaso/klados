import { type TaxonFilterToken } from "../taxa/search";
import { filterTokenKey } from "../taxa/utils";
import { unitFitsCharacter } from "../units/utils";
import { selectFilterLabels } from "./repo";
import type { FilterChip } from "./types";

/**
 * Describe filter tokens for display, e.g. "Cap · Diameter: 5 cm".
 * Marks token null (undescribable) whenever any id it names is gone
 */
export async function resolveFilterChips(
  tokens: TaxonFilterToken[],
): Promise<FilterChip[]> {
  if (!tokens.length) return [];

  const labels = await selectFilterLabels({
    featureIds: tokens.map((token) => token.f).filter((id) => id !== undefined),
    characterIds: tokens
      .filter((token) => token.k !== "f")
      .map((token) => token.c),
    numericCharacterIds: tokens
      .filter((token) => token.k === "n")
      .map((token) => token.c),
    traitValueIds: tokens
      .filter((token) => token.k === "c")
      .map((token) => token.t),
    unitIds: tokens
      .filter((token) => token.k === "n")
      .map((token) => token.u)
      .filter((id) => id !== undefined),
  });

  return tokens.map((token) => {
    const key = filterTokenKey(token);

    if (token.k === "f") {
      const label = labels.features.get(token.f);
      return { key, label: label ?? null };
    }

    const characterLabel = labels.characters.get(token.c);
    const featureLabel =
      token.f === undefined ? null : labels.features.get(token.f);

    if (characterLabel === undefined || featureLabel === undefined) {
      return { key, label: null };
    }

    // A character not attached to the named feature can
    // never have a state row for that pair.
    if (
      token.f !== undefined &&
      !labels.featuresByCharacter.get(token.c)?.has(token.f)
    ) {
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

    const namedUnit =
      token.u === undefined ? undefined : labels.units.get(token.u);

    // Matches the query's rule: a unit that doesn't fit the character makes
    // the value uninterpretable, so the chip must not look ordinary.
    if (
      !unitFitsCharacter(
        token.u,
        namedUnit?.familyId,
        labels.unitRequirements.get(token.c),
      )
    ) {
      return { key, label: null };
    }

    if (namedUnit === undefined) {
      return { key, label: `${prefix}${characterLabel}: ${token.v}` };
    }
    return {
      key,
      label: `${prefix}${characterLabel}: ${token.v} ${namedUnit.symbol}`,
    };
  });
}
