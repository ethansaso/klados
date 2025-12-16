import z from "zod";

/** Zod API which simply trims a string. */
export const trimmed = (strError: string) => z.string(strError).trim();

/** Zod API which trims a string and rejects empty strings. */
export const trimmedNonEmpty = (strError: string) =>
  z
    .string(strError)
    .trim()
    .refine((s) => s.length > 0, {
      message: strError,
    });

/** Zod API which trims a string and treats empty strings as undefined. */
export const trimmedOptional = (strError: string) =>
  z
    .string(strError)
    .trim()
    .optional()
    .transform((s) => (s && s.length > 0 ? s : undefined));

/** Zod API which trims a string and treats empty strings as undefined, then validates as a URL. */
export const trimmedUrlOptional = (msg: string) =>
  z
    .string(msg)
    .trim()
    .optional()
    .transform((s) => (s && s.length > 0 ? s : undefined))
    .pipe(z.url(msg).optional());
