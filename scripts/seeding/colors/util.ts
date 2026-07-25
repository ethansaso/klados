import { COLOR_ALIASES } from "./aliases";
import { BASE_HUES, NEUTRALS, SHADES, SPECIAL_COLOR_NAMES } from "./canonicals";

/**
 * One color: a primary label plus every other label that means the same thing.
 * All of them share `hexCode` and land in a single synonym set.
 */
export type ColorDef = {
  label: string;
  hexCode: string | null;
  synonyms: string[];
};

// TODO: eliminate duplication with src/lib/utils/colorConversions.ts
function hslToHex(h: number, s: number, l: number): string {
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
 * Trait labels are stored lowercase, matching the rest of the glossary.
 * Display code capitalizes where it needs to, e.g. at the head of prose.
 */
const normalize = (label: string) => label.trim().toLowerCase();

/**
 * Every systematically generated color: each base hue crossed with the shade
 * ramp, plus the neutrals and specials. Vernacular names live in COLOR_ALIASES.
 */
function generatePalette(): ColorDef[] {
  const neutrals = NEUTRALS.map(({ name, hex }) => ({
    label: normalize(name),
    hexCode: hex as string | null,
    synonyms: [],
  }));

  const hues = BASE_HUES.flatMap(({ name, deg }) =>
    SHADES.map(({ modifier, s, l }) => ({
      label: normalize(modifier ? `${modifier} ${name}` : name),
      hexCode: hslToHex(deg, s * 100, l * 100) as string | null,
      synonyms: [],
    })),
  );

  const specials = SPECIAL_COLOR_NAMES.map((name) => ({
    label: normalize(name),
    hexCode: null,
    synonyms: [],
  }));

  return [...neutrals, ...hues, ...specials];
}

/**
 * The generated palette with COLOR_ALIASES folded in, one entry per synonym set.
 * Throws if any label is claimed twice or an alias key names no generated color.
 */
export function buildColorSeedPlan(): ColorDef[] {
  const defs = generatePalette();
  const errors: string[] = [];

  const generated = new Map(defs.map((def) => [def.label, def]));
  const ownerByLabel = new Map(generated);

  function claim(label: string, def: ColorDef): boolean {
    const owner = ownerByLabel.get(label);

    if (owner) {
      errors.push(
        owner === def
          ? `Color "${def.label}" lists the label "${label}" more than once.`
          : `Label "${label}" is claimed by both "${owner.label}" and "${def.label}".`,
      );
      return false;
    }

    ownerByLabel.set(label, def);
    return true;
  }

  if (generated.size !== defs.length) {
    errors.push("Two generated colors share a label.");
  }

  for (const [colorLabel, synonyms] of Object.entries(COLOR_ALIASES)) {
    const def = generated.get(normalize(colorLabel));

    if (!def) {
      errors.push(
        `"${colorLabel}" is not a generated color label, so its synonyms have nowhere to go.`,
      );
      continue;
    }

    for (const synonym of synonyms.map(normalize)) {
      if (claim(synonym, def)) def.synonyms.push(synonym);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Color palette configuration errors:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
    );
  }

  return defs;
}
