import { queryOptions } from "@tanstack/react-query";
import { listTaxonEditsAdminFn } from "../server-fns/taxon-edits/listTaxonEditsAdminFn";

export const taxonEditsAdminQueryOptions = (page: number, pageSize: number) =>
  queryOptions({
    queryKey: ["taxonEdits", "admin", { page, pageSize }],
    queryFn: () => listTaxonEditsAdminFn({ data: { page, pageSize } }),
  });
