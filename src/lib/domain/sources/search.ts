import z from "zod";
import { orderDirEnum } from "../../validation/orderBy";
import { PaginationSchema } from "../../validation/pagination";

const orderByEnum = z.enum(["name", "publicationYear", "createdAt"]);

export const SourceFilterSchema = z.object({
  q: z.string().optional(),
  orderBy: orderByEnum.optional(),
  orderDir: orderDirEnum.optional(),
});

export const SourceSearchSchema = PaginationSchema.extend(
  SourceFilterSchema.shape
);

export type SourceFilters = z.infer<typeof SourceFilterSchema>;
export type SourceSearchParams = z.infer<typeof SourceSearchSchema>;
