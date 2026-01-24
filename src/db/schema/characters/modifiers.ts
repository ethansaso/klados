import {
  pgEnum,
  pgTable,
  serial,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { withTimestamps } from "../../utils/timestamps";

export type ModifierClass = (typeof MODIFIER_CLASSES)[number];
export type AffixType = (typeof AFFIX_TYPES)[number];

export const MODIFIER_CLASSES = [
  "positional",
  "reliability",
  "contingent",
  "reactive",
] as const;
export const AFFIX_TYPES = ["prefix", "suffix"] as const;

export const modifierClassEnum = pgEnum("modifier_type", MODIFIER_CLASSES);
export const modifierAffixEnum = pgEnum("affix", AFFIX_TYPES);

/**
 * Groups of categorical modifiers (e.g., "Position", "KOH Reaction").
 */
export const categoricalModifierGroup = pgTable(
  "categorical_modifier_group",
  withTimestamps({
    id: serial("id").primaryKey(),
    key: text("key").notNull(),
    label: text("label").notNull(),
    description: text("description").notNull().default(""),
    type: modifierClassEnum("type").notNull(),
  }),
  (t) => [uniqueIndex("categorical_modifier_groups_key_uq").on(t.key)],
);

/**
 * Values for categorical modifiers (e.g., "at apex", "at base" for group "position").
 */
export const categoricalModifierValue = pgTable(
  "categorical_modifier_value",
  withTimestamps({
    id: serial("id").primaryKey(),
    groupId: serial("group_id")
      .notNull()
      .references(() => categoricalModifierGroup.id),
    value: text("value").notNull(),
    description: text("description").notNull().default(""),
    affixType: modifierAffixEnum("affix_type").notNull(),
  }),
  (t) => [
    uniqueIndex("categorical_modifier_values_group_id_value_uq").on(
      t.groupId,
      t.value,
    ),
  ],
);
