import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";
import { media } from "../schema";

export type AffixType = (typeof AFFIX_TYPES)[number];

export const AFFIX_TYPES = ["prefix", "suffix"] as const;

export const modifierAffixEnum = pgEnum("affix", AFFIX_TYPES);

/**
 * Groups of modifiers (e.g., "Position", "KOH Reaction").
 */
export const modifierGroup = pgTable(
  "modifier_group",
  withTimestamps({
    id: serial("id").primaryKey(),
    label: text("label").notNull(),
    description: text("description").notNull().default(""),
  }),
  (t) => [uniqueIndex("modifier_groups_label_uq").on(t.label)],
);

/**
 * Values for modifiers (e.g., "at apex", "at base" for group "position").
 */
export const modifierValue = pgTable(
  "modifier_value",
  withTimestamps({
    id: serial("id").primaryKey(),
    groupId: serial("group_id")
      .notNull()
      .references(() => modifierGroup.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    description: text("description").notNull().default(""),
    affixType: modifierAffixEnum("affix_type").notNull(),
    mediaId: integer("media_id").references(() => media.id, {
      onDelete: "set null",
    }),
  }),
  (t) => [
    uniqueIndex("modifier_values_group_id_value_uq").on(t.groupId, t.label),
  ],
);
