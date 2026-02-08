# KeyGen Process

The key generation system creates dichotomous identification keys for taxonomic hierarchies. Given a root taxon, it produces a tree structure with rationales provided based off taxon group/character states.

Last updated 2/8/26.

TODO: This directory will need a complete overhaul once characters/groups are overhauled for semantic structure.

## Overview

The process consists of two main phases:

1. **Hierarchy Discovery**: Traverse the taxon tree to collect all relevant taxa and their character states
2. **Key Building**: Recursively split taxa into groups using distinguishing characters

Additionally, **hydration** is used to enrich the structural key with human-readable labels and media.

## Hierarchy Discovery

**Location:** `hierarchy/`

Starting from a root taxon ID, perform a breadth-first traversal of the taxon tree to collect:

- All taxa within the subtree (respecting `taxonLimit` and `maxDepthFromRoot` options)
- Each taxon's metadata: name, rank, and child IDs
- Character states for each taxon (categorical trait values)

### Considerations

- **Taxon Limit:** If the traversal exceeds `taxonLimit`, it truncates and "retreats" to the lowest-rank taxa discovered so far. This prevents runaway generation on very large clades.
- **Bulk Loading:** Character states are loaded in bulk after structure discovery, not per-taxon, for efficiency.
- The result is a flat `Map<taxonId, HierarchyTaxonNode>` that can be queried during key construction.

## Key Building

**Location:** `key-building/`

Recursively construct the key tree given a hierarchy:

1. Start at the root taxon node
2. For each group of sibling taxa that need differentiation:
   - Find candidate **splits** that partition the group based on character states
   - Select the best split according to scoring criteria
   - Create branches with rationales explaining the distinguishing traits
   - Recurse into each resulting subgroup
3. When a branch leads to a single taxon, descend into its subtaxa (hierarchical children)

### Node Types

- **`KeyTaxonNode`**: Represents a taxon in the hierarchy; may have branches to differentiate its children
- **`KeyDiffNode`**: A "differentiation point" that splits a group of sibling taxa; not tied to a single taxon

### Branch Rationales

Each branch carries a `rationale` explaining why taxa fall into that branch:

- **`character-definition`**: A discrete difference in states for one or more characters
- **`group-present-absent`**: An entire character group(s) is present/absent

## Splitting

**Location:** `splitting/`

The splitting subsystem finds ways to partition a group of taxa based on their character states.

### Character-Based Splits (`splitting/characters/`)

1. **Index characters**: Build a map of which taxa have which character states
2. **Find shared trait groups**: Identify trait combinations that cleanly partition taxa
3. **Score candidates**: Evaluate each potential split using configurable criteria
4. **Merge compatible splits**: Combine splits that produce identical partitions (adding more distinguishing clauses)

### Group Present/Absent Splits

A simpler split type: divide taxa into those that have _any_ character defined in a given character group vs. those that don't. Useful when entire character groups (e.g., "wing venation") are only applicable to certain taxa.

### Scoring Considerations

Splits are scored based on the `keyShape` option:

- **`balanced`**: Prefer splits that evenly divide taxa and create more branches (easier for users to navigate)
- **`lopsided`**: Prefer splits that isolate small groups (useful for "process of elimination" identification)

Additional factors:

- More clauses (characters) in a split = small bonus (more diagnostic power)
- Inverted clauses ("does NOT have X") are downweighted (harder for users to observe absence)

TODO: make sure I accounted for bucket case of "a, b, not a/b" even if "not a/b" contains "red, yellow" and "yellow, green"

TODO: add quantitative data

## Hydration

**Location:** `hydration/`

The raw key tree contains only IDs. Before sending to clients, hydrate it with human-readable data:

- **Taxon nodes:** scientific name, common name, primary media image
- **Character rationales:** character labels, trait labels with descriptions and colors
- **Group rationales:** character group labels

### Graph Format

The hydrated key is serialized as a flat graph (`HydratedKeyGraphDTO`) with:

- `nodes[]`: All taxon and diff nodes
- `branches[]`: Edges with source/target IDs and hydrated rationales
- `rootNodeId`: Entry point for traversal

This format is suitable for client-side rendering and can be **dehydrated** back to the structural form if needed (e.g. editing, storage)

## Configuration Options

Defined in `options.ts`:

| Option             | Description                                     | Default      |
| ------------------ | ----------------------------------------------- | ------------ |
| `taxonLimit`       | Max taxa to include before truncating           | 500          |
| `keyShape`         | `"balanced"` or `"lopsided"` scoring preference | `"balanced"` |
| `maxBranches`      | Maximum branches at any split point (2-10)      | 5            |
| `maxDepthFromRoot` | Maximum hierarchical depth to traverse          | unlimited    |

## Entry Points

- **`generateKeyForTaxon(taxonId, options)`**: Main generation function (used by workers)
- **`hydrateKey(rootNode)`**: Enrich a raw key with labels and media
- **`dehydrateKeyGraph(dto)`**: Convert hydrated graph back to structural tree
