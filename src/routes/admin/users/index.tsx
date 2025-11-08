import { Table } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { usersQueryOptions } from "../../../lib/queries/users";

export const Route = createFileRoute("/admin/users/")({
  // Coerce query-string values to numbers, set sane defaults (1-based page)
  validateSearch: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),

  // Re-run loader when these change
  loaderDeps: ({ search: { page, pageSize } }) => ({ page, pageSize }),

  // SSR prefetch for hydration
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(
      usersQueryOptions(deps.page, deps.pageSize)
    );
  },

  component: RouteComponent,
});

function RouteComponent() {
  const { page, pageSize } = useSearch({ from: "/admin/users/" });
  const { data, isLoading, isError, error } = useQuery(
    usersQueryOptions(page, pageSize)
  );

  if (isLoading) return <p>Loading…</p>;
  if (isError) return <p>Failed to load users: {(error as Error).message}</p>;
  if (!data) return <p>No data.</p>;

  const { items, total } = data;
  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>ID</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Username</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Creation Date</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Banned?</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {items.map((user) => (
          <Table.Row key={user.id}>
            <Table.Cell>{user.id}</Table.Cell>
            <Table.Cell>{user.username}</Table.Cell>
            <Table.Cell>
              {new Date(user.createdAt).toLocaleDateString()}
            </Table.Cell>
            <Table.Cell>{user.banned ? "Yes" : "No"}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}
