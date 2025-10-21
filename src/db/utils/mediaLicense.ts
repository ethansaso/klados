import { pgEnum } from "drizzle-orm/pg-core";

export const mediaLicense = pgEnum("media_license", [
  "cc0",              // Creative Commons Zero (public domain)
  "cc-by",            // Attribution
  "cc-by-sa",         // Attribution-ShareAlike
  "cc-by-nc",         // Attribution-NonCommercial
  "cc-by-nc-sa",      // Attribution-NonCommercial-ShareAlike
  "cc-by-nd",         // Attribution-NoDerivatives
  "cc-by-nc-nd",      // Attribution-NonCommercial-NoDerivatives
  "all-rights-reserved",
]);