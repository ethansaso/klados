import { pgEnum } from "drizzle-orm/pg-core";

export type MediaLicense = (typeof MEDIA_LICENSES)[number];

export const MEDIA_LICENSES = [
  "unknown",
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
  unknown: "Unknown License",
  cc0: "CC0",
  "cc-by": "CC BY",
  "cc-by-sa": "CC BY-SA",
  "cc-by-nc": "CC BY-NC",
  "cc-by-nc-sa": "CC BY-NC-SA",
  "cc-by-nd": "CC BY-ND",
  "cc-by-nc-nd": "CC BY-NC-ND",
  "all-rights-reserved": "All Rights Reserved",
};

/** Where each license's terms can be read; null when there's nothing to link. */
export const MEDIA_LICENSE_LINKS: Record<MediaLicense, string | null> = {
  unknown: null,
  cc0: "https://creativecommons.org/publicdomain/zero/1.0/",
  "cc-by": "https://creativecommons.org/licenses/by/4.0/",
  "cc-by-sa": "https://creativecommons.org/licenses/by-sa/4.0/",
  "cc-by-nc": "https://creativecommons.org/licenses/by-nc/4.0/",
  "cc-by-nc-sa": "https://creativecommons.org/licenses/by-nc-sa/4.0/",
  "cc-by-nd": "https://creativecommons.org/licenses/by-nd/4.0/",
  "cc-by-nc-nd": "https://creativecommons.org/licenses/by-nc-nd/4.0/",
  "all-rights-reserved": null,
};

export const mediaLicenseEnum = pgEnum("media_license", MEDIA_LICENSES);
