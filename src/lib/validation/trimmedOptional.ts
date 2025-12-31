import z from "zod";

type TrimLimitOptions = {
  min?: { value: number; message?: string };
  max?: { value: number; message?: string };
};

/** Zod API which simply trims a string. */
export const trimmed = (strError: string) => z.string(strError).trim();

/** Zod API which trims a string and rejects empty strings. */
export const trimmedNonEmpty = (
  strError: string,
  options: TrimLimitOptions = {}
) => {
  let s = z.string(strError).trim();

  if (options.min) {
    s = s.min(options.min.value, options.min.message ?? strError);
  }

  if (options.max) {
    s = s.max(options.max.value, options.max.message ?? strError);
  }

  return s.refine((v) => v.length > 0, { message: strError });
};

/** Zod API which trims a string and treats empty strings as undefined. */
export const trimmedOptional = (
  strError: string,
  options: TrimLimitOptions = {}
) => {
  let s = z.string(strError).trim();

  if (options.min) {
    s = s.min(options.min.value, options.min.message ?? strError);
  }

  if (options.max) {
    s = s.max(options.max.value, options.max.message ?? strError);
  }

  return s.optional().transform((v) => (v && v.length > 0 ? v : undefined));
};

/** Zod API which trims a string and treats empty strings as undefined, then validates as a URL. */
export const trimmedUrlOptional = (msg: string) =>
  z
    .string(msg)
    .trim()
    .optional()
    .transform((s) => (s && s.length > 0 ? s : undefined))
    .pipe(z.url(msg).optional());
