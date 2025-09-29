import { Table } from '@radix-ui/themes'
import { createFileRoute } from '@tanstack/react-router'
import { usersQueryOptions } from '../../../lib/queries/user'
import { z } from "zod";

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
  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>User ID</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Role</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {/* Example static data, replace with dynamic data as needed */}
        <Table.Row>
          <Table.Cell>1</Table.Cell>
          <Table.Cell>user@example.com</Table.Cell>
          <Table.Cell>Admin</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table.Root>
  )
}
