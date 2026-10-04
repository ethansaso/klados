import { eq } from "drizzle-orm";
import {
    taxon as taxaTbl,
    TAXON_RANKS_DESCENDING,
} from "../../../../db/schema/schema";
import { type Transaction } from "../types/transactionType";

type Rank = (typeof TAXON_RANKS_DESCENDING)[number];

function rankIndex(r: Rank): number {
  const i = TAXON_RANKS_DESCENDING.indexOf(r);
  if (i < 0) throw new Error(`Unknown rank: ${r}`);
  return i;
}

/**
 * Policy:
 *  - Parent is optional. If provided, it must exist and be strictly coarser than the child.
 *  - Ranks may be skipped (e.g. a species directly under a family).
 *  - If `taxonId` is provided (existing taxon), every direct child must be strictly
 *    finer than `nextRank`. Direct children suffice, since each is already coarser
 *    than its own children.
 */
export async function assertHierarchyInvariant(
  tx: Transaction,
  nextParentId: number | null,
  nextRank: Rank,
  taxonId?: number,
) {
  const nextIdx = rankIndex(nextRank);

  if (nextParentId) {
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
    if (rankIndex(parent.rank) >= nextIdx) {
      throw new Error(
        "Parent rank must be coarser than child rank (e.g., genus > species).",
      );
    }
  }

  if (taxonId !== undefined) {
    // Children of any status, since they remain attached to this taxon
    const childRanks = await tx
      .selectDistinct({ rank: taxaTbl.rank })
      .from(taxaTbl)
      .where(eq(taxaTbl.parentId, taxonId));

    const conflicting = childRanks
      .map((c) => c.rank)
      .filter((r) => rankIndex(r) <= nextIdx);

    if (conflicting.length > 0) {
      throw new Error(
        `Rank must be coarser than all subtaxa; found subtaxa ranked ${conflicting.join(", ")}.`,
      );
    }
  }
}
