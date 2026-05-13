import { pgTable, serial, text, uniqueIndex } from "drizzle-orm/pg-core";
import { mediaLicenseEnum } from "../../utils/mediaLicense";
import { withTimestamps } from "../../utils/timestamps";
import { user } from "../auth";

export const media = pgTable(
  "media",
  withTimestamps({
    id: serial("id").primaryKey(),

    storageKey: text("storage_key").notNull(),
    contentType: text("content_type").notNull(),
    license: mediaLicenseEnum("license").notNull(),
    owner: text("owner").notNull().default(""),
    source: text("source").notNull().default(""),

    uploadedBy: text("uploaded_by").references(() => user.id, {
      onDelete: "set null",
    }),
  }),
  (t) => [uniqueIndex("media_storage_key_uq").on(t.storageKey)],
);
