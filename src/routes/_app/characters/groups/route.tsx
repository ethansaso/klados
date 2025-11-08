import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { characterGroupsQueryOptions } from "../../../../lib/queries/characterGroups";
import { SearchWithQuerySchema } from "../../../../lib/validation/search";

export const Route = createFileRoute("/_app/characters/groups")({
  validateSearch: (s) => SearchWithQuerySchema.parse(s),
  loaderDeps: ({ search: { page, pageSize, q } }) => ({ page, pageSize, q }),
  loader: async ({ context, deps: { page, pageSize, q } }) => {
    await context.queryClient.ensureQueryData(
      characterGroupsQueryOptions(page, pageSize, { q })
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  const { data: paginatedResult } = useSuspenseQuery(
    characterGroupsQueryOptions(search.page, search.pageSize, {
      q: search.q,
    })
  );

  return <div>Hello "/_app/characters/groups/"!</div>;
}
