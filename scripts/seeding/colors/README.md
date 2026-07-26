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

Each base hue in `canonicals.ts` is crossed with a fixed shade ramp
(pale, light, plain, grayish, dark, dark grayish) to give 66 swatches with
purely systematic names. Alongside those sit a monotone scale for
white/gray/black and the simple "colorless".

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

Every swatch is one synonym set. Its systematic name plus everything listed
under that name in `aliases.ts` are members of the set and carry the same
hex code.

Vernacular names are just synonyms, with no special machinery behind them.
Earth tones live under the systematic name of the swatch they describe, e.g.

```ts
"dark orange": ["brown", "brownish"],
```

so "dark orange" and "brown" coexist and mean the same thing. Likewise
"light red" and "pink". Alias keys must be generated labels, so there is
exactly one entry per swatch and no chaining to worry about.

No label is privileged in the database; the systematic name is only the one
the preview leads with and the one `aliases.ts` keys on.

Labels are stored lowercase, as everywhere else in the glossary. Display
code capitalizes where it needs to, e.g. `formatTraitLabel` takes the
capital at the head of a prose fragment.

## Re-running

Seeding reconciles rather than replaces. Colors that exist already are
moved into the right set and given the right hex, and colors outside
the palette are left untouched and reported at the end, so hand-entered
vocabulary survives a re-run. Running it twice is a no-op.

Use `npm run test:colors` to print the full palette without touching the
database. It builds and validates the same plan the seeder uses.
