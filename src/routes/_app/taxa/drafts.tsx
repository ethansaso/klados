import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ContentContainer } from "../../../components/ContentContainer";
import { taxaQueryOptions } from "../../../lib/queries/taxa";
import { routeSeo } from "../../../lib/utils/head/routeSeo";
import { SearchSchema } from "../../../lib/validation/search";
import { TaxonGrid } from "./-TaxonGrid";

export const Route = createFileRoute("/_app/taxa/drafts")({
  head: () =>
    routeSeo({
      title: "Taxon Drafts | Klados",
    }),
  validateSearch: SearchSchema,
  loaderDeps: ({ search: { page, pageSize: pageSize } }) => ({
    page,
    pageSize,
  }),
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

  return (
    <ContentContainer align="start">
      <TaxonGrid results={paginatedResult} />
    </ContentContainer>
  );
}
