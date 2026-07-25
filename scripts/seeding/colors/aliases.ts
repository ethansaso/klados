/**
 * Every non-systematic label for the "colors" trait set, keyed by the generated
 * color it means. Each key must be a generated label; its synonyms join that
 * color's synonym set and inherit its hex code.
 *
 * Earth tones and "pink" live here rather than in the generator: they are
 * ordinary vernacular names for a swatch that already has a systematic one.
 *
 * Labels are lowercase, as everywhere else in the glossary.
 */
export const COLOR_ALIASES: Record<string, string[]> = {
  "pale red": ["grayish pink"],
  "light red": ["pink", "pinkish"],
  red: ["reddish", "crimson", "scarlet"],
  "grayish red": ["brick red"],
  "dark red": ["maroon", "wine"],
  "light red-orange": ["coral", "salmon"],
  "red-orange": ["reddish orange", "orange-red", "vermilion"],
  "grayish red-orange": ["tawny"],
  "dark red-orange": [
    "red-brown",
    "dark reddish orange",
    "rust-colored",
    "rusty",
    "rusty brown",
    "rufous",
    "ferruginous",
  ],
  "dark grayish red-orange": ["grayish red-brown"],
  "pale orange": ["tan", "light brown"],
  "grayish orange": ["fulvous", "ocher", "ochre"],
  "dark orange": ["brown", "brownish"],
  "dark grayish orange": [
    "grayish brown",
    "taupe",
    "umber",
    "brownish gray",
    "fuscous",
  ],
  "light yellow-orange": ["buff", "khaki"],
  "yellow-orange": [
    "yellowish orange",
    "orangish yellow",
    "amber",
    "amber-colored",
    "marigold",
  ],
  "dark yellow-orange": ["yellow-brown"],
  "dark grayish yellow-orange": ["grayish yellow-brown"],
  "pale yellow": [
    "beige",
    "cream-colored",
    "creamy-white",
    "straw-colored",
    "cream",
    "creamy",
  ],
  yellow: ["yellowish", "luteous"],
  "dark yellow": ["olive-brown", "olive", "olivaceous"],
  "dark grayish yellow": ["grayish olive-brown"],
  "yellow-green": ["chartreuse", "yellowish green", "greenish yellow", "lime"],
  "dark yellow-green": ["olive-green"],
  "dark grayish yellow-green": ["grayish olive-green"],
  "pale green": ["mint", "minty"],
  "blue-green": ["cyan", "bluish green", "greenish blue"],
  "grayish blue-green": ["viridian", "turquoise"],
  "dark blue-green": ["teal"],
  "dark grayish blue-green": ["grayish teal"],
  blue: ["bluish"],
  "dark blue": ["navy", "navy blue"],
  "pale purple": ["lavender"],
  purple: ["violet", "purplish"],
  "pale red-purple": ["mauve", "lilac"],
  "red-purple": ["magenta", "rose", "fuchsia", "reddish purple"],
  "dark red-purple": ["burgundy", "plum"],
  gray: ["grey", "grayish"],
  black: ["jet black", "fuliginous", "blackish"],
  white: ["whitish", "off-white", "pale", "pallid"],
  colorless: ["hyaline", "transparent"],
} as const;
