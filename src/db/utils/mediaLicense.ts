import { pgEnum } from "drizzle-orm/pg-core";

export const MEDIA_LICENSES = [
  "cc0", // Creative Commons Zero (public domain)
  "cc-by", // Attribution
  "cc-by-sa", // Attribution-ShareAlike
  "cc-by-nc", // Attribution-NonCommercial
  "cc-by-nc-sa", // Attribution-NonCommercial-ShareAlike
  "cc-by-nd", // Attribution-NoDerivatives
  "cc-by-nc-nd", // Attribution-NonCommercial-NoDerivatives
  "all-rights-reserved",
] as const;

export const HUMAN_CASED_MEDIA_LICENSES: Record<
  (typeof MEDIA_LICENSES)[number],
  string
> = {
  cc0: "CC0",
  "cc-by": "CC BY",
  "cc-by-sa": "CC BY-SA",
  "cc-by-nc": "CC BY-NC",
  "cc-by-nc-sa": "CC BY-NC-SA",
  "cc-by-nd": "CC BY-ND",
  "cc-by-nc-nd": "CC BY-NC-ND",
  "all-rights-reserved": "All Rights Reserved",
};

export const mediaLicenseEnum = pgEnum("media_license", MEDIA_LICENSES);
