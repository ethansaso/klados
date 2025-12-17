import z from "zod";

export type PaginatedResult<T> = {
  page: number;
  pageSize: number;
  total: number;
  items: T[];
};

export type PaginationParams = z.infer<typeof PaginationSchema>;

export const paginationDefaults = {
  page: 1,
  pageSize: 20,
};

export const PaginationSchema = z.object({
  page: z
    .number()
    .int()
    .min(1)
    .default(paginationDefaults.page)
    .catch(paginationDefaults.page),
  pageSize: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(paginationDefaults.pageSize)
    .catch(paginationDefaults.pageSize),
});
