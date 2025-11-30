import { capitalizeWord, snakeCase } from "../../utils/case";
import { COLOR_ALIASES } from "./aliases";
import {
  BASE_HUE_NAMES,
  HUE_MAP,
  MODIFIERS,
  MODIFIERS_SL,
  NEUTRAL_COLOR_NAMES,
  NEUTRAL_MAP,
  SPECIAL_COLOR_NAMES,
} from "./canonicals";

export type Modifier = (typeof MODIFIERS)[number];

/**
 * Fully normalized alias entry.
 *
 * - aliasLabel: human-facing string ("Maroon")
 * - aliasKey: machine key derived from aliasLabel ("maroon")
 * - canonicalKey: machine key of the canonical color ("dark_red")
 */
export type NormalizedColorAlias = {
  aliasLabel: string;
  aliasKey: string;
  canonicalKey: string;
};

/**
 * Canonical color definition used by seeding + tests.
 */
export type ColorDef = {
  /** Snake-cased machine key */
  key: string;
  label: string;
  hexCode: string | null;
};

// TODO: eliminate duplication with src/lib/utils/colorConversions.ts
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

  const toHex = (x: number) =>
    Math.round(255 * x)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

// ANSI block for preview
export function ansiBlock(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `\x1b[48;2;${r};${g};${b}m  \x1b[0m`;
}

/**
 * Build a label from a modifier + hue name.
 *
 * Rules:
 * - Modifier "" → omitted.
 * - "dark-grayish" → "Dark grayish" (two separate words).
 * - Hyphens are preserved inside hue names: "red-brown" → "Red-Brown".
 */
export function buildLabel(mod: Modifier, hueName: string): string {
  const words: string[] = [];

  if (mod !== "") {
    if (mod === "dark-grayish") {
      // Two words, no hyphen between them.
      words.push("Dark", "grayish");
    } else {
      words.push(capitalizeWord(mod));
    }
  }

  const hueParts = hueName.split(/\s+/);
  for (const part of hueParts) {
    words.push(
      part
        .split("-")
        .map((w) => capitalizeWord(w))
        .join("-")
    );
  }

  return words.join(" ");
}

// Turn the parallel arrays into a lookup map
const MODIFIERS_SL_MAP: Record<Modifier, { s: number; l: number }> =
  MODIFIERS.reduce(
    (acc, mod, idx) => {
      acc[mod] = MODIFIERS_SL[idx];
      return acc;
    },
    {} as Record<Modifier, { s: number; l: number }>
  );

export function getNeutralColors() {
  return NEUTRAL_COLOR_NAMES.map((name, i) => ({
    name,
    hex: NEUTRAL_MAP[i],
  }));
}

export function colorFromHueIndex(
  rowIndex: number,
  modifier: Modifier
): string {
  const hueDeg = HUE_MAP[rowIndex];
  const sl = MODIFIERS_SL_MAP[modifier];
  if (!sl) {
    throw new Error(`Missing S/L for modifier "${modifier}"`);
  }
  return hslToHex(hueDeg, sl.s * 100, sl.l * 100);
}

/**
 * Expand one BASE_HUE_NAMES row into 6 semantic color names + hex.
 *
 * Universal HSL slots for each row (modifier → S/L):
 *   pale, light, base, grayish, dark, dark-grayish
 *
 * Naming rules by row type:
 *
 * 1) Unbroken hue (light == base == dark), e.g. ["green","green","green"]
 *    pale green
 *    light green
 *    green
 *    grayish green
 *    dark green
 *    dark grayish green
 *
 * 2) Light-shifted (light != base, dark == base), e.g. ["pink","red","red"]
 *    grayish pink        (pale slot)
 *    pink                (light slot)
 *    red                 (base slot)
 *    grayish red         (grayish slot)
 *    dark red            (dark slot)
 *    dark grayish red    (dark-grayish slot)
 *
 * 3) Dark-shifted (light == base, dark != base), e.g. ["yellow","yellow","brown"]
 *    pale yellow         (pale slot)
 *    light yellow        (light slot)
 *    yellow              (base slot)
 *    grayish yellow      (grayish slot)
 *    brown               (dark slot)
 *    grayish brown       (dark-grayish slot)
 *
 * HSL is driven purely by the modifier; hue names are semantic.
 */
export function expandHueRow(
  rowIndex: number,
  lightHue: string,
  baseHue: string,
  darkHue: string
): { name: string; hex: string }[] {
  const isLightShifted = lightHue !== baseHue;
  const isDarkShifted = darkHue !== baseHue;

  const entries: { name: string; modifier: Modifier }[] = [];

  if (!isLightShifted && !isDarkShifted) {
    // Case 1: unbroken hue strip
    entries.push(
      { name: `pale ${baseHue}`, modifier: "pale" },
      { name: `light ${baseHue}`, modifier: "light" },
      { name: baseHue, modifier: "" },
      { name: `grayish ${baseHue}`, modifier: "grayish" },
      { name: `dark ${baseHue}`, modifier: "dark" },
      { name: `dark grayish ${baseHue}`, modifier: "dark-grayish" }
    );
  } else if (isLightShifted && !isDarkShifted) {
    // Case 2: light-shifted (e.g. ["pink","red","red"])
    entries.push(
      { name: `grayish ${lightHue}`, modifier: "pale" }, // grayish pink
      { name: lightHue, modifier: "light" }, // pink
      { name: baseHue, modifier: "" }, // red
      { name: `grayish ${baseHue}`, modifier: "grayish" },
      { name: `dark ${baseHue}`, modifier: "dark" },
      { name: `dark grayish ${baseHue}`, modifier: "dark-grayish" }
    );
  } else if (!isLightShifted && isDarkShifted) {
    // Case 3: dark-shifted (e.g. ["yellow","yellow","brown"])
    entries.push(
      { name: `pale ${baseHue}`, modifier: "pale" },
      { name: `light ${baseHue}`, modifier: "light" },
      { name: baseHue, modifier: "" },
      { name: `grayish ${baseHue}`, modifier: "grayish" },
      { name: darkHue, modifier: "dark" },
      { name: `grayish ${darkHue}`, modifier: "dark-grayish" }
    );
  } else {
    // With your current BASE_HUE_NAMES this should never happen.
    throw new Error(
      `Unexpected both-shifted hue row: [${lightHue}, ${baseHue}, ${darkHue}]`
    );
  }

  return entries.map(({ name, modifier }) => ({
    name,
    hex: colorFromHueIndex(rowIndex, modifier),
  }));
}

// Convenience: everything at once
export function getAllHueColors() {
  return BASE_HUE_NAMES.map(([lightHue, baseHue, darkHue], rowIndex) => ({
    groupBase: baseHue,
    colors: expandHueRow(rowIndex, lightHue, baseHue, darkHue),
  }));
}

function generateSpecialColors(): ColorDef[] {
  return SPECIAL_COLOR_NAMES.map((name) => ({
    key: snakeCase(name),
    label: capitalizeWord(name),
    hexCode: null,
  }));
}

function generateNeutralColorDefs(): ColorDef[] {
  return getNeutralColors().map(({ name, hex }) => {
    const rawLabel = name.replace(/-/g, " "); // light-gray -> light gray
    const label = rawLabel
      .split(/\s+/)
      .map((w) => capitalizeWord(w))
      .join(" ");
    const key = snakeCase(label);
    return { key, label, hexCode: hex };
  });
}

function generateHueColorDefs(): ColorDef[] {
  const groups = getAllHueColors();
  const colors: ColorDef[] = [];

  for (const group of groups) {
    for (const c of group.colors) {
      // c.name is already something like "grayish pink", "dark grayish red-brown"
      const label = c.name
        .split(/\s+/)
        .map((word) =>
          word
            .split("-")
            .map((w) => capitalizeWord(w))
            .join("-")
        )
        .join(" ");
      const key = snakeCase(label);
      colors.push({ key, label, hexCode: c.hex });
    }
  }

  // Deduplicate by key, last one wins (shouldn't really collide).
  const byKey = new Map<string, ColorDef>();
  for (const c of colors) {
    byKey.set(c.key, c);
  }

  return Array.from(byKey.values());
}

/**
 * Full canonical palette as ColorDef objects.
 */
export function generateCanonicalColorDefs(): ColorDef[] {
  const neutrals = generateNeutralColorDefs();
  const hues = generateHueColorDefs();
  const specials = generateSpecialColors();

  const byKey = new Map<string, ColorDef>();

  for (const c of [...neutrals, ...hues, ...specials]) {
    byKey.set(c.key, c);
  }

  return Array.from(byKey.values());
}

/**
 * Flatten COLOR_ALIASES into a list of normalized alias entries.
 */
export function getNormalizedColorAliases(): NormalizedColorAlias[] {
  const result: NormalizedColorAlias[] = [];

  for (const [canonicalKey, aliasLabels] of Object.entries(COLOR_ALIASES)) {
    for (const aliasLabel of aliasLabels) {
      const aliasKey = snakeCase(aliasLabel);
      result.push({
        aliasLabel,
        aliasKey,
        canonicalKey,
      });
    }
  }

  return result;
}
