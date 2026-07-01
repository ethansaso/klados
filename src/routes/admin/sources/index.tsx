import { IconButton, Table } from "@radix-ui/themes";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { PiBroom } from "react-icons/pi";
import { sourcesQueryOptions } from "../../../lib/queries/sources";
import { removeSourceUsagesAdminFn } from "../../../lib/server-fns/sources/removeSourceUsagesAdminFn";
import { SearchSchema } from "../../../lib/validation/search";

export const Route = createFileRoute("/admin/sources/")({
  validateSearch: SearchSchema,
  loaderDeps: ({ search: { page, pageSize: pageSize } }) => ({
    page,
    pageSize,
  }),
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(sourcesQueryOptions(deps));
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { page, pageSize: pageSize } = Route.useSearch();
  const qc = useQueryClient();
  const { data: sources } = useSuspenseQuery(
    sourcesQueryOptions({ page, pageSize }),
  );
  const scrubSources = useServerFn(removeSourceUsagesAdminFn);

  const handleScrubClick = async (sourceId: number) => {
    if (
      confirm(
        "Are you sure you want to scrub all usages of this source? This action cannot be undone.",
      )
    ) {
      await scrubSources({ data: sourceId });
      await qc.invalidateQueries({ queryKey: ["sources"] });
      await qc.invalidateQueries({ queryKey: ["taxon"] });
    }
  };

  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Source Name</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Authors</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>URL</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Usages</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {sources.items.map((source) => (
          <Table.Row key={source.id}>
            <Table.Cell>{source.name}</Table.Cell>
            <Table.Cell>{source.authors}</Table.Cell>
            <Table.Cell>{source.url}</Table.Cell>
            <Table.Cell>{source.usageCount}</Table.Cell>
            <Table.Cell>
              <IconButton
                color="tomato"
                variant="ghost"
                onClick={() => handleScrubClick(source.id)}
              >
                <PiBroom />
              </IconButton>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}
