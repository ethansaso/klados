import {
  index,
  integer,
  pgTable,
  serial,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { categoricalTraitSet, categoricalTraitValue } from "./categoricalTrait";

/**
 * Curator-defined families of related canonical values within a trait set.
 */
export const affinityGroup = pgTable(
  "affinity_group",
  {
    id: serial("id").primaryKey(),
    traitSetId: integer("trait_set_id")
      .notNull()
      .references(() => categoricalTraitSet.id, { onDelete: "restrict" }),
    label: text("label").notNull(),
  },
  (t) => [
    uniqueIndex("affinity_groups_trait_label_uq").on(t.traitSetId, t.label),
    index("affinity_groups_trait_idx").on(t.traitSetId),
  ]
);

/**
 * Bridge table expressing canonical value membership in an affinity group.
 */
export const affinityGroupMember = pgTable(
  "affinity_group_member",
  {
    id: serial("id").primaryKey(),
    groupId: integer("group_id")
      .notNull()
      .references(() => affinityGroup.id, { onDelete: "cascade" }),
    canonicalValueId: integer("canonical_value_id")
      .notNull()
      .references(() => categoricalTraitValue.id, { onDelete: "restrict" }),
  },
  (t) => [
    uniqueIndex("affinity_group_members_uq").on(t.groupId, t.canonicalValueId),
    index("affinity_group_members_group_idx").on(t.groupId),
    index("affinity_group_members_value_idx").on(t.canonicalValueId),
  ]
);
