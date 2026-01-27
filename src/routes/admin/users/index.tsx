import { IconButton, Table, Tooltip } from "@radix-ui/themes";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { PiHammer } from "react-icons/pi";
import { banUserAdminFn } from "../../../lib/api/users/banUserAdminFn";
import { unbanUserAdminFn } from "../../../lib/api/users/unbanUserAdminFn";
import {
  userQueryOptions,
  usersAdminViewQueryOptions,
} from "../../../lib/queries/users";
import { SearchSchema } from "../../../lib/validation/search";

export const Route = createFileRoute("/admin/users/")({
  // Coerce query-string values to numbers, set sane defaults (1-based page)
  validateSearch: SearchSchema,

  // Re-run loader when these change
  loaderDeps: ({ search: { page, pageSize: pageSize } }) => ({
    page,
    pageSize,
  }),

  // SSR prefetch for hydration
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(
      usersAdminViewQueryOptions(deps.page, deps.pageSize),
    );
  },

  component: RouteComponent,
});

function RouteComponent() {
  const { page, pageSize: pageSize } = useSearch({ from: "/admin/users/" });
  const qc = useQueryClient();
  const {
    data: { items },
  } = useSuspenseQuery(usersAdminViewQueryOptions(page, pageSize));
  const banUser = useServerFn(banUserAdminFn);
  const unbanUser = useServerFn(unbanUserAdminFn);

  const invalidate = async (userId: string) => {
    await qc.invalidateQueries({ queryKey: ["users"] });
    await qc.invalidateQueries(userQueryOptions(userId));
  };

  const handleBanUser = async (userId: string) => {
    if (confirm("Are you sure you want to ban this user?")) {
      await banUser({ data: { userId } });
      await invalidate(userId);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    if (confirm("Are you sure you want to unban this user?")) {
      await unbanUser({ data: { userId } });
      await invalidate(userId);
    }
  };

  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>ID</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Username</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Creation Date</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Banned?</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {items.map((user) => (
          <Table.Row key={user.id}>
            <Table.Cell>{user.id}</Table.Cell>
            <Table.Cell>{user.username}</Table.Cell>
            <Table.Cell>{user.email}</Table.Cell>
            <Table.Cell>
              {new Date(user.createdAt).toLocaleDateString()}
            </Table.Cell>
            <Table.Cell>{user.banned ? "Yes" : "No"}</Table.Cell>
            <Table.Cell>
              {user.banned ? (
                <Tooltip content="Unban User">
                  <IconButton
                    variant="ghost"
                    color="tomato"
                    onClick={() => handleUnbanUser(user.id)}
                  >
                    <PiHammer />
                  </IconButton>
                </Tooltip>
              ) : (
                <Tooltip
                  content={
                    user.role === "admin"
                      ? "Admin users cannot be banned"
                      : "Ban User"
                  }
                >
                  <IconButton
                    variant="ghost"
                    color="tomato"
                    onClick={() => handleBanUser(user.id)}
                    disabled={user.role === "admin"}
                  >
                    <PiHammer />
                  </IconButton>
                </Tooltip>
              )}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}
