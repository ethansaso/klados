# Modifier Seeding

Klados uses a modifier system to apply the 'who', 'when', 'where', 'why', 'how' to the 'what' of its character system.

## Core modifiers

While a number of classes can be ascribed to modifiers in the database, some are deliberately restricted only to the seeding script to avoid user error.

Namely, these are the 'positional' and 'reliability' modifier classes, for which there is only one reasonable modifier group per respective class.

## Reliability closed-set

While the 'positional' modifier group still allows for curators to assign new modifiers, the 'reliability' modifier group is intentionally preserved as a 'closed-set' of modifiers.

This is to avoid confusion / unnecessary verbosity when using the reliability modifiers; for example, curators unknowingly compromising the key algorithm by creating 'always'/'never', adding confusing synonyms, etc.
