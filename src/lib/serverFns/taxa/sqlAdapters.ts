import { and, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { taxonName as namesTbl } from "../../../db/schema/taxa/name";
import { taxon as taxaTbl } from "../../../db/schema/taxa/taxon";

/** Alias for accepted scientific name. */
export const sci = alias(namesTbl, "sci");
/** Alias for preferred common name. */
export const common = alias(namesTbl, "common");
/** Join predicate for accepted scientific name. */
export const sciJoinPred = and(
  eq(sci.taxonId, taxaTbl.id),
  eq(sci.locale, "sci"),
  eq(sci.isPreferred, true)
);
/** Join predicate for preferred English common name. */
export const commonJoinPred = and(
  eq(common.taxonId, taxaTbl.id),
  eq(common.locale, "en"),
  eq(common.isPreferred, true)
);

/** Reusable selection shape for a TaxonDTO. */
export const selectTaxonDTO = {
  id: taxaTbl.id,
  parentId: taxaTbl.parentId,
  rank: taxaTbl.rank,
  sourceGbifId: taxaTbl.sourceGbifId,
  sourceInatId: taxaTbl.sourceInatId,
  status: taxaTbl.status,
  media: taxaTbl.media,
  notes: taxaTbl.notes,
  acceptedName: sci.value,
  preferredCommonName: common.value,
  activeChildCount: sql<number>`(
    SELECT COUNT(*) FROM ${taxaTbl} AS c
    WHERE c.parent_id = ${taxaTbl.id} AND c.status = 'active'
  )`,
};
