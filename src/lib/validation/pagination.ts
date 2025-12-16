import z from "zod";

export type PaginatedResult<T> = {
  page: number;
  pageSize: number;
  total: number;
  items: T[];
};

export type PaginationParams = z.infer<typeof PaginationSchema>;

export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});
