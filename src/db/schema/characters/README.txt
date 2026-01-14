--- Representing Numeric Data ---
There are two conceivable philosophies for unitful implementations of numeric characters.

The first is to use all units scaled to a canonical unit, e.g. 5 mm is stored internally as 0.005.
The second is to define all numeric states as values of relative units, e.g. 5 mm is stored as unit: <mm_id>, value: 5

First approach pros/cons
Pros
- Extremely simple queries -- just ==, >, <
- Easily processed by dichotomous key algorithm, etc. internal processes are first-class
Cons
- Rounding issues 
- Conversion must be applied at every read/write
- Where to put display unit?

Second approach pros/cons
Pros
- Store exactly number that users enter
- Unit is first-class property of value
- Conversion unnecessary at read/write
Cons
- Messy, probably inefficient queries (have to search every type of unit w/ a conversion)
- Conversion must be applied at every processing step (e.g. dichotomous key generation)




--- Klados' Approach ---
First approach, use 'displayUnitId' and 'siValue'
Pros
- Simple queries
- Easy algorithmic use
- Display unit only requires a quick join on reads for its label in DTOs
Cons
- Rounding issues (requires consistent policy)
- Conversion on read/write

Fundamentally, conversion should never change value. And assuming converted value is computed via e.g. decimalJS using rounding policy,
should never see a value like 0.68495.