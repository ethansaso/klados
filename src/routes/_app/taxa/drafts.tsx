import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { taxaQueryOptions } from "../../../lib/queries/taxa";
import { TaxonGrid } from "./-TaxonGrid";

const SearchSchema = z.object({
  page: z.coerce.number().int().min(1).max(9999).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const Route = createFileRoute("/_app/taxa/drafts")({
  validateSearch: (s) => SearchSchema.parse(s),
  loaderDeps: ({ search: { page, pageSize } }) => ({ page, pageSize }),
  loader: async ({ context, deps: { page, pageSize } }) => {
    await context.queryClient.ensureQueryData(
      taxaQueryOptions(page, pageSize, { status: "draft" })
    );
  },
  component: TaxaDraftsPage,
});

function TaxaDraftsPage() {
  const search = Route.useSearch();
  const { data: paginatedResult } = useSuspenseQuery(
    taxaQueryOptions(search.page, search.pageSize, {
      status: "draft",
    })
  );

  return <TaxonGrid results={paginatedResult} />;
}
