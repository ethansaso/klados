# Color Seeding

This is the documentation for the color seeding process, a standardized
system of colors inferred from numerous standards and user needs.

## Base hues

Colors are generated via a system which begins with 'base hues'.
This is a custom set of hues inspired by ISCC-NBS and the Munsell System.
It contains 'buckets' for all reasonable, semantically defined color sets;
that is, it forms a compromise between a primary/secondary/tertiary color system
and human-parsable / familiar nomenclature.

At present, it contains all tertiary definitions besides blue-purple,
which is often an arbitrary distinction on many displays. Magenta and azure
are opposite cases to blue-purple, since the hues around them left too wide a gap for
colors people read as distinct.

Each base hue in `src/lib/domain/traits/colorPalette.ts` is crossed with
seven shades (pale, light, bright, plain, grayish, dark, very dark) to give 91
swatches with purely systematic names. Alongside those sit a monotone scale for
white/gray/black and the simple "colorless". These generated names are the
palette's **canonical** labels.

### Enumeration of Base Hues

Red
Red-Orange
Orange
Yellow-Orange
Yellow
Yellow-Green
Green
Blue-Green
Azure
Blue
Purple
Magenta
Red-Purple
White
Gray
Black

## Shades

Swatches are generated in OKLCH to boost consistency across hues.
Each shade sets a lightness and a chroma for every hue at once:

- `follow` lets each hue keep some of its natural lightness, so yellows stay
  light and blues stay dark.
- `cool` scales chroma for green through red-purple.
- `peak` caps chroma beneath the max the screen can show.
- `lift` keeps light shades visibly lighter than plain (mostly for yellow).
- Bright follows each hue's most vivid lightness instead.

Neutrals use fixed hexes.

## Synonym sets

Every swatch is one synonym set, holding its canonical label plus any synonyms
curators add. The hex code lives on the set itself to avoid drift between
individual traits, and only the seeder writes it.

Labels are stored lowercase, as everywhere else in the glossary, and are
unique per character ignoring case, so "Brown" can't sit beside "brown". Display
code capitalizes where it needs to, e.g. `formatTraitLabel` takes the
capital at the head of a prose fragment.

## Aliases

Aliases are common names that mean one canonical color, defined in
`colorAliases.ts`. They are protected identically to canonical labels.
Some are generated for every hue:

- "vivid X" for bright
- "deep X" for dark
- "dark grayish X" and "blackish X" for very dark
- reversed and adjective forms of two-hue names, e.g. "orange-red" and
  "reddish orange"

Others are listed by hand, mostly from ISCC-NBS (e.g. "pink", "brown",
"olive").

## Locked sets

The Color character has `hasLockedSets`, so the app enforces:

- New labels must join an existing set; no new sets can be created or split off.
- Canonical labels can't be renamed, moved, or deleted.
- The character itself can't be renamed or deleted, since seeding finds it by
  label.

Curators can still add, rename, move, and delete any other synonym, and a moved
synonym takes on its new set's swatch.

## Re-running

Seeding reconciles rather than replaces:

- Each set is found by its canonical label, and created if missing.
- Each set gets its palette hex, so tuning the palette and re-seeding recolors
  existing sets.
- Each alias is added to its canonical's set, or moved there with its states.
- Curator synonyms are never touched.

Changes are listed before anything is committed. Sets with no canonical label
are reported so their labels can be moved by hand. If canonical labels share a
set, seeding refuses to run rather than guess. Running it twice is a no-op.

Use `npm run test:colors` to print the full palette without touching the
database.

Fresh environments get the palette from seeding, but synonyms only from the
database: use `npm run db:dump` / `db:load` to bring them over.
