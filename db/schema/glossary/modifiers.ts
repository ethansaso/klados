import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";

export type ModifierClass = (typeof MODIFIER_CLASSES)[number];
export type AffixType = (typeof AFFIX_TYPES)[number];

export const MODIFIER_CLASSES = [
  "positional",
  "reliability",
  "demographic",
  "reactive",
] as const;
export const AFFIX_TYPES = ["prefix", "suffix"] as const;

export const modifierClassEnum = pgEnum("modifier_type", MODIFIER_CLASSES);
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
    class: modifierClassEnum("class").notNull(),
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
    value: text("value").notNull(),
    description: text("description").notNull().default(""),
    affixType: modifierAffixEnum("affix_type").notNull(),
    canonicalValueId: integer("canonical_value_id"),
  }),
  (t) => [
    unique("modifier_values_group_id_id_uq").on(t.groupId, t.id),
    foreignKey({
      name: "canonical_modifier_same_group_fk",
      columns: [t.groupId, t.canonicalValueId],
      foreignColumns: [t.groupId, t.id],
    }).onDelete("cascade"),
    uniqueIndex("modifier_values_group_id_value_uq").on(t.groupId, t.value),
    index("modifier_values_canonical_target_idx")
      .on(t.canonicalValueId)
      .where(sql`${t.canonicalValueId} IS NOT NULL`),
    check(
      "modifier_values_no_self_alias_ck",
      sql`${t.canonicalValueId} IS NULL OR ${t.canonicalValueId} <> ${t.id}`,
    ),
    check(
      "modifier_values_description_canonical_ck",
      sql`${t.canonicalValueId} IS NULL OR ${t.description} = ''`,
    ),
  ],
);
