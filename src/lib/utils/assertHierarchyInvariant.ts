import { eq, ExtractTablesWithRelations } from "drizzle-orm";
import {
  NodePgDatabase,
  NodePgQueryResultHKT,
} from "drizzle-orm/node-postgres";
import { PgTransaction } from "drizzle-orm/pg-core";
import * as schema from "../../db/schema/schema";
import {
  taxon as taxaTbl,
  TAXON_RANKS_DESCENDING,
} from "../../db/schema/schema";

type Rank = (typeof TAXON_RANKS_DESCENDING)[number];

type Db = NodePgDatabase<typeof schema>;
type Tx = PgTransaction<
  NodePgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;
type DbOrTx = Db | Tx;

function rankIndex(r: Rank): number {
  const i = TAXON_RANKS_DESCENDING.indexOf(r);
  if (i < 0) throw new Error(`Unknown rank: ${r}`);
  return i;
}

/**
 * Current policy:
 *  - Parent is optional. If no parent is provided, no hierarchy checks apply.
 *  - If a parent is provided, it must exist and be strictly coarser than the child.
 */
export async function assertHierarchyInvariant(params: {
  tx: DbOrTx;
  nextParentId: number | null;
  nextRank: Rank;
}) {
  const { tx, nextParentId, nextRank } = params;

  // Parent optional: nothing to validate when absent.
  if (!nextParentId) return;

  // Load parent row (minimal fields)
  const [parent] = await tx
    .select({
      id: taxaTbl.id,
      rank: taxaTbl.rank,
    })
    .from(taxaTbl)
    .where(eq(taxaTbl.id, nextParentId))
    .limit(1);

  if (!parent) {
    throw new Error("Parent not found.");
  }

  // Parent rank must be strictly coarser than child rank
  const parentIdx = rankIndex(parent.rank as Rank);
  const childIdx = rankIndex(nextRank);
  if (parentIdx >= childIdx) {
    throw new Error(
      "Parent rank must be coarser than child rank (e.g., genus > species)."
    );
  }
}
