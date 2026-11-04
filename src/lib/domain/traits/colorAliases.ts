import { BASE_HUES, buildColorPalette, SHADES } from "./colorPalette";

/** A code-defined synonym, kept in its canonical color's set. */
export type ColorAlias = {
  label: string;
  canonical: string;
};

/** Extra modifiers each band also goes by, applied to every base hue. */
const SHADE_ALIASES: Partial<
  Record<(typeof SHADES)[number]["modifier"], string[]>
> = {
  bright: ["vivid"],
  grayish: ["dull", "muted"],
  dark: ["deep"],
  "very dark": ["dark grayish", "blackish"],
};

/** Adjective forms of the hue words in two-hue colors, e.g. "reddish orange". */
const HUE_ADJECTIVES: Record<string, string> = {
  red: "reddish",
  orange: "orangish",
  yellow: "yellowish",
  green: "greenish",
  blue: "bluish",
  purple: "purplish",
};

/** Common names that each mean one canonical color, mainly from ISCC-NBS. */
const NAMED_ALIASES: Record<string, string[]> = {
  red: ["reddish"],
  "light red": ["pink", "pinkish"],
  "pale red": ["pale pink"],
  "light red-orange": ["yellowish pink"],
  "light red-purple": ["purplish pink"],
  yellow: ["yellowish"],
  green: ["greenish"],
  blue: ["bluish"],
  purple: ["purplish"],
  "bright purple": ["violet"],
  "dark orange": ["brown", "brownish"],
  "dark red-orange": ["red-brown", "reddish brown"],
  "dark yellow-orange": ["yellow-brown", "yellowish brown"],
  "dark yellow": ["olive", "olive-brown"],
  "dark yellow-green": ["olive-green"],
  "very dark orange": ["dark brown", "blackish brown"],
  white: ["whitish"],
  gray: ["grayish"],
  black: ["blackish"],
};

/**
 * Every color "alias", i.e. a protected term which nevertheless is not
 * the original canonical.
 *
 * Throws if an alias repeats, collides with a canonical
 * label, or names a color the palette lacks.
 */
export function buildColorAliases(): ColorAlias[] {
  const aliases: ColorAlias[] = [];

  for (const { name } of BASE_HUES) {
    for (const [modifier, extras] of Object.entries(SHADE_ALIASES)) {
      for (const extra of extras ?? []) {
        aliases.push({
          label: `${extra} ${name}`,
          canonical: `${modifier} ${name}`,
        });
      }
    }

    const [first, second] = name.split("-");
    if (first && second) {
      aliases.push(
        { label: `${second}-${first}`, canonical: name },
        { label: `${HUE_ADJECTIVES[first]} ${second}`, canonical: name },
        { label: `${HUE_ADJECTIVES[second]} ${first}`, canonical: name },
      );
    }
  }

  for (const [canonical, labels] of Object.entries(NAMED_ALIASES)) {
    for (const label of labels) aliases.push({ label, canonical });
  }

  assertValidAliases(aliases);
  return aliases;
}

function assertValidAliases(aliases: ColorAlias[]): void {
  const canonicals = new Set(buildColorPalette().map((color) => color.label));
  const seen = new Set<string>();

  for (const { label, canonical } of aliases) {
    if (!canonicals.has(canonical)) {
      throw new Error(
        `Alias "${label}" names "${canonical}", which isn't a canonical color.`,
      );
    }
    if (canonicals.has(label)) {
      throw new Error(`Alias "${label}" is already a canonical color.`);
    }
    if (seen.has(label)) {
      throw new Error(`Alias "${label}" is defined twice.`);
    }
    seen.add(label);
  }
}
