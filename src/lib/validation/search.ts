import z from "zod";

export const SearchSchema = z.object({
  page: z.coerce.number().int().min(1).default(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20).catch(1),
});

export const SearchWithQuerySchema = SearchSchema.extend({
  q: z.string().trim().default("").optional(),
});
