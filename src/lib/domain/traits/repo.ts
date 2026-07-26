import {
  and,
  asc,
  count,
  eq,
  ilike,
  inArray,
  ne,
  notExists,
  sql,
} from "drizzle-orm";
import {
  traitSynonymSet as setsTbl,
  taxonCharacterStateCategorical as tcsTbl,
  categoricalTraitValue as valsTbl,
} from "../../../../db/schema/schema";
import {
  type FuzzyQuery,
  fuzzyLabelPredicate,
  fuzzySimilarity,
} from "../../utils/sql/fuzzyLabel";
import type { Transaction } from "../../utils/types/transactionType";
import type {
  TraitSynonymDTO,
  TraitValueDTO,
  TraitValuePaginatedResult,
  TraitValueRow,
} from "./types";

/** Aggregate of a trait's synonyms, ordered by label. */
const synonymsAgg = sql<TraitSynonymDTO[]>`
  COALESCE((
    SELECT json_agg(json_build_object('id', syn."id", 'label', syn."label")
                    ORDER BY syn."label")
    FROM ${valsTbl} syn
    WHERE syn."synonym_set_id" = ${valsTbl.synonymSetId}
      AND syn."id" <> ${valsTbl.id}
  ), '[]'::json)
`;

/** Count of categorical states referencing a given trait value. */
function usageAggFor(tx: Transaction, filter: ReturnType<typeof eq>) {
  return tx
    .select({
      traitValueId: tcsTbl.traitValueId,
      usageCount: sql<number>`CAST(COUNT(${tcsTbl.id}) AS INT)`.as(
        "usage_count",
      ),
    })
    .from(tcsTbl)
    .where(filter)
    .groupBy(tcsTbl.traitValueId)
    .as("usage_agg");
}

/** Allocate a new, empty synonym set for a character. */
export async function insertSynonymSet(
  tx: Transaction,
  characterId: number,
): Promise<{ id: number }> {
  const [row] = await tx
    .insert(setsTbl)
    .values({ characterId })
    .returning({ id: setsTbl.id });

  if (!row) throw new Error("Failed to create synonym set.");
  return row;
}

/** Number of trait values currently in a set. */
export async function countTraitsInSet(
  tx: Transaction,
  setId: number,
): Promise<number> {
  const [row] = await tx
    .select({ n: count() })
    .from(valsTbl)
    .where(eq(valsTbl.synonymSetId, setId));

  return row?.n ?? 0;
}

/** Sizes of several sets at once, keyed by set id. Absent = empty. */
export async function selectSynonymSetSizes(
  tx: Transaction,
  setIds: number[],
): Promise<Map<number, number>> {
  if (!setIds.length) return new Map();

  const rows = await tx
    .select({
      setId: valsTbl.synonymSetId,
      size: sql<number>`CAST(COUNT(*) AS INT)`,
    })
    .from(valsTbl)
    .where(inArray(valsTbl.synonymSetId, setIds))
    .groupBy(valsTbl.synonymSetId);

  return new Map(rows.map((r) => [r.setId, r.size]));
}

/**
 * Delete a synonym set, but only if it has no members. Returns whether it
 * was deleted.
 */
export async function deleteSynonymSetIfEmpty(
  tx: Transaction,
  setId: number,
): Promise<boolean> {
  const deleted = await tx
    .delete(setsTbl)
    .where(
      and(
        eq(setsTbl.id, setId),
        notExists(
          tx
            .select({ one: sql`1` })
            .from(valsTbl)
            .where(eq(valsTbl.synonymSetId, setId)),
        ),
      ),
    )
    .returning({ id: setsTbl.id });

  return deleted.length > 0;
}

/**
 * Merges two sets, using `toSetId` as the destination set.
 * Is not responsible for deleting the 'from' set afterwards!
 */
export async function moveTraitsBetweenSets(
  tx: Transaction,
  fromSetId: number,
  toSetId: number,
): Promise<void> {
  await tx
    .update(valsTbl)
    .set({ synonymSetId: toSetId })
    .where(eq(valsTbl.synonymSetId, fromSetId));
}

/**
 * Move a single trait value into a different set.
 * Is not responsible for deleting the 'from' set afterwards if empty!
 */
export async function moveTraitToSet(
  tx: Transaction,
  traitId: number,
  setId: number,
): Promise<void> {
  await tx
    .update(valsTbl)
    .set({ synonymSetId: setId })
    .where(eq(valsTbl.id, traitId));
}

/**
 * Delete a trait value by id.
 * Returns `id`, or `null` if nothing deleted.
 */
export async function deleteTraitValueById(
  tx: Transaction,
  id: number,
): Promise<{ id: number } | null> {
  const [deleted] = await tx
    .delete(valsTbl)
    .where(eq(valsTbl.id, id))
    .returning({ id: valsTbl.id });

  return deleted ?? null;
}

/** Fetches identity/relation information about a trait. */
export async function selectTraitIdentityById(
  tx: Transaction,
  id: number,
): Promise<Pick<
  TraitValueRow,
  "id" | "characterId" | "synonymSetId" | "label"
> | null> {
  const [row] = await tx
    .select({
      id: valsTbl.id,
      characterId: valsTbl.characterId,
      synonymSetId: valsTbl.synonymSetId,
      label: valsTbl.label,
    })
    .from(valsTbl)
    .where(eq(valsTbl.id, id))
    .limit(1);

  return row ?? null;
}

/**
 * Every label belonging to a synonym set that has at least one label matching
 * `fq`, scoped to one character. Has an optional `excludeTraitId` which drops
 * just that row (without excluding synonyms).
 *
 * Unbounded: a character's full label list is small enough that scoring it
 * in JS afterward is cheap, so there is no row limit to tune here.
 */
export async function selectSynonymCandidateRows(
  tx: Transaction,
  args: {
    characterId: number;
    excludeTraitId?: number;
    fq: FuzzyQuery | null;
  },
): Promise<
  { id: number; label: string; synonymSetId: number; similarity: number }[]
> {
  const { characterId, excludeTraitId, fq } = args;

  const inScope = [eq(valsTbl.characterId, characterId)];
  if (excludeTraitId !== undefined) {
    inScope.push(ne(valsTbl.id, excludeTraitId));
  }

  // With no query, browse all in-scope sets
  const setFilter = fq
    ? inArray(
        valsTbl.synonymSetId,
        tx
          .select({ setId: valsTbl.synonymSetId })
          .from(valsTbl)
          .where(and(...inScope, fuzzyLabelPredicate(valsTbl.label, fq))),
      )
    : undefined;

  return tx
    .select({
      id: valsTbl.id,
      label: valsTbl.label,
      synonymSetId: valsTbl.synonymSetId,
      similarity: fq
        ? fuzzySimilarity(valsTbl.label, fq)
        : sql<number>`0::real`,
    })
    .from(valsTbl)
    .where(and(...inScope, setFilter))
    .orderBy(asc(valsTbl.label));
}

/** Insert a trait value row into an existing synonym set. */
export async function insertTraitValueRow(
  tx: Transaction,
  args: {
    characterId: number;
    synonymSetId: number;
    label: string;
    description?: string;
    hexCode?: string | null;
  },
): Promise<TraitValueRow | null> {
  const [inserted] = await tx
    .insert(valsTbl)
    .values({
      characterId: args.characterId,
      synonymSetId: args.synonymSetId,
      label: args.label,
      description: args.description ?? "",
      hexCode: args.hexCode ?? null,
    })
    .returning();

  return inserted ?? null;
}

/** Fetch a TraitValueDTO by id. */
export async function selectTraitValueDtoById(
  tx: Transaction,
  id: number,
): Promise<TraitValueDTO | null> {
  const usageAgg = usageAggFor(tx, eq(tcsTbl.traitValueId, id));

  const [row] = await tx
    .select({
      id: valsTbl.id,
      characterId: valsTbl.characterId,
      synonymSetId: valsTbl.synonymSetId,
      label: valsTbl.label,
      hexCode: valsTbl.hexCode,
      description: valsTbl.description,
      usageCount: sql<number>`COALESCE(${usageAgg.usageCount}, 0)`,
      synonyms: synonymsAgg,
    })
    .from(valsTbl)
    .leftJoin(usageAgg, eq(usageAgg.traitValueId, valsTbl.id))
    .where(eq(valsTbl.id, id))
    .limit(1);

  return row ?? null;
}

/** Fetch multiple TraitValueDTOs by IDs. */
export async function selectTraitValueDtosByIds(
  tx: Transaction,
  ids: number[],
): Promise<TraitValueDTO[]> {
  if (!ids.length) {
    return [];
  }

  const usageAgg = usageAggFor(tx, inArray(tcsTbl.traitValueId, ids));

  return tx
    .select({
      id: valsTbl.id,
      characterId: valsTbl.characterId,
      synonymSetId: valsTbl.synonymSetId,
      label: valsTbl.label,
      hexCode: valsTbl.hexCode,
      description: valsTbl.description,
      usageCount: sql<number>`COALESCE(${usageAgg.usageCount}, 0)`,
      synonyms: synonymsAgg,
    })
    .from(valsTbl)
    .leftJoin(usageAgg, eq(usageAgg.traitValueId, valsTbl.id))
    .where(inArray(valsTbl.id, ids))
    .orderBy(asc(valsTbl.id));
}

/**
 * Patches a trait value's metadata.
 * Not responsible for synonym-set membership operations.
 */
export async function updateTraitValueRow(
  tx: Transaction,
  args: {
    id: number;
    characterId: number;
    label?: string;
    hexCode?: string | null;
    description?: string;
  },
): Promise<{ id: number } | null> {
  const patch: Partial<
    Pick<TraitValueRow, "label" | "hexCode" | "description">
  > = {};

  if (args.label !== undefined) patch.label = args.label;
  if (args.hexCode !== undefined) patch.hexCode = args.hexCode;
  if (args.description !== undefined) patch.description = args.description;

  const scope = and(
    eq(valsTbl.id, args.id),
    eq(valsTbl.characterId, args.characterId),
  );

  if (!Object.keys(patch).length) {
    const [existing] = await tx
      .select({ id: valsTbl.id })
      .from(valsTbl)
      .where(scope)
      .limit(1);
    return existing ?? null;
  }

  const [updated] = await tx
    .update(valsTbl)
    .set(patch)
    .where(scope)
    .returning({ id: valsTbl.id });

  return updated ?? null;
}

/** Fetch paginated TraitValueDTOs for a given character. */
export async function selectTraitValuesByCharacterPaginated(
  tx: Transaction,
  characterId: number,
  page: number,
  pageSize: number,
  opts?: { q?: string },
): Promise<TraitValuePaginatedResult> {
  const offset = (page - 1) * pageSize;

  const filters: ReturnType<typeof eq>[] = [
    eq(valsTbl.characterId, characterId),
  ];
  if (opts?.q) {
    filters.push(ilike(valsTbl.label, `%${opts.q}%`));
  }
  const where = and(...filters)!;
  const usageAgg = usageAggFor(tx, eq(tcsTbl.characterId, characterId));

  const items = await tx
    .select({
      id: valsTbl.id,
      characterId: valsTbl.characterId,
      synonymSetId: valsTbl.synonymSetId,
      label: valsTbl.label,
      hexCode: valsTbl.hexCode,
      description: valsTbl.description,
      usageCount: sql<number>`COALESCE(${usageAgg.usageCount}, 0)`,
      synonyms: synonymsAgg,
    })
    .from(valsTbl)
    .leftJoin(usageAgg, eq(usageAgg.traitValueId, valsTbl.id))
    .where(where)
    .orderBy(asc(valsTbl.label), asc(valsTbl.id))
    .limit(pageSize)
    .offset(offset);

  const [totals] = await tx
    .select({ total: count() })
    .from(valsTbl)
    .where(where);

  return { items, page, pageSize, total: totals?.total ?? 0 };
}

/**
 * Select all trait values for the given characters (unpaginated).
 */
export async function selectAllTraitValuesByCharacters(
  tx: Transaction,
  characterIds: number[],
): Promise<Map<number, ExtractionTraitValue[]>> {
  if (!characterIds.length) return new Map();

  const rows = await tx
    .select({
      id: valsTbl.id,
      characterId: valsTbl.characterId,
      label: valsTbl.label,
      hexCode: valsTbl.hexCode,
    })
    .from(valsTbl)
    .where(inArray(valsTbl.characterId, characterIds))
    .orderBy(asc(valsTbl.characterId), asc(valsTbl.label));

  const grouped = new Map<number, ExtractionTraitValue[]>();
  for (const row of rows) {
    let list = grouped.get(row.characterId);
    if (!list) {
      list = [];
      grouped.set(row.characterId, list);
    }
    list.push({
      id: row.id,
      label: row.label,
      hexCode: row.hexCode,
    });
  }
  return grouped;
}

export type ExtractionTraitValue = {
  id: number;
  label: string;
  hexCode: string | null;
};
