import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { taxaQueryOptions } from "../../../lib/queries/taxa";
import { SearchSchema } from "../../../lib/validation/search";
import { TaxonGrid } from "./-TaxonGrid";

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
