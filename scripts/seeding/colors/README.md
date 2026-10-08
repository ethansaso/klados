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
which is often an arbitrary distinction on many displays.

Each base hue in `src/lib/domain/traits/colorPalette.ts` is crossed with a
fixed shade ramp (pale, light, plain, grayish, dark, dark grayish) to give 66
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
Blue
Purple
Red-Purple
White
Gray
Black

## Synonym sets

Every swatch is one synonym set, holding its canonical label plus any synonyms
curators add. The hex code lives on the set itself to avoid drift between
individual traits, and only the seeder writes it.

Labels are stored lowercase, as everywhere else in the glossary. Display
code capitalizes where it needs to, e.g. `formatTraitLabel` takes the
capital at the head of a prose fragment.

## Locked sets

The Color character has `hasLockedSets`, so the app enforces:

- New labels must join an existing set; no new sets can be created or split off.
- Canonical labels can't be created, renamed, moved, or deleted.
- The character itself can't be renamed or deleted, since seeding finds it by
  label.

Curators can still add, rename, move, and delete any other synonym, and a moved
synonym takes on its new set's swatch.

## Re-running

Seeding reconciles rather than replaces. It finds each set by its canonical
label, creating the label and set if missing, writes each set's hex, and keeps
the character locked. It never touches other labels, and reports any set that
has no canonical label so its labels can be moved into a palette set. If
canonical labels share a set or differ only by case, it refuses to run rather
than guess. Running it twice is a no-op.

Use `npm run test:colors` to print the full palette without touching the
database.

Fresh environments get the palette from seeding, but synonyms only from the
database: use `npm run db:dump` / `db:load` to bring them over.
