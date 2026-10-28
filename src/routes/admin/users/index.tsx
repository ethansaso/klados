import { Flex, IconButton, Table, Text } from "@radix-ui/themes";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  PiCheck,
  PiHammer,
  PiUserMinus,
  PiUserPlus,
  PiX,
} from "react-icons/pi";
import { ResponsiveTooltip } from "../../../components/ResponsiveTooltip";
import type { UserDTO } from "../../../lib/domain/users/types";
import {
  userQueryOptions,
  usersAdminViewQueryOptions,
} from "../../../lib/queries/users";
import { banUserAdminFn } from "../../../lib/server-fns/users/banUserAdminFn";
import { setCuratorAdminFn } from "../../../lib/server-fns/users/setCuratorAdminFn";
import { unbanUserAdminFn } from "../../../lib/server-fns/users/unbanUserAdminFn";
import { capitalizeFirstLetter } from "../../../lib/utils/formatting/casing";
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
  const setCurator = useServerFn(setCuratorAdminFn);

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

  const handleSetCurator = async (userId: string, curator: boolean) => {
    const verb = curator
      ? "promote this user to curator"
      : "demote this curator";
    if (confirm(`Are you sure you want to ${verb}?`)) {
      await setCurator({ data: { userId, curator } });
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
          <Table.ColumnHeaderCell>Verified?</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Role</Table.ColumnHeaderCell>
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
              <Text
                color={user.emailVerified ? "grass" : "tomato"}
                aria-label={user.emailVerified ? "Yes" : "No"}
              >
                {user.emailVerified ? <PiCheck /> : <PiX />}
              </Text>
            </Table.Cell>
            <Table.Cell>{capitalizeFirstLetter(user.role)}</Table.Cell>
            <Table.Cell>
              {new Date(user.createdAt).toLocaleDateString()}
            </Table.Cell>
            <Table.Cell>{user.banned ? "Yes" : "No"}</Table.Cell>
            <Table.Cell>
              <Flex gap="3">
                {user.banned ? (
                  <ResponsiveTooltip content="Unban User">
                    <IconButton
                      variant="ghost"
                      color="tomato"
                      onClick={() => handleUnbanUser(user.id)}
                    >
                      <PiHammer />
                    </IconButton>
                  </ResponsiveTooltip>
                ) : (
                  <ResponsiveTooltip
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
                  </ResponsiveTooltip>
                )}
                <CuratorToggle
                  role={user.role}
                  onClick={() =>
                    handleSetCurator(user.id, user.role !== "curator")
                  }
                />
              </Flex>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}

function CuratorToggle({
  role,
  onClick,
}: {
  role: UserDTO["role"];
  onClick: () => void;
}) {
  const isCurator = role === "curator";
  return (
    <ResponsiveTooltip
      content={
        role === "admin"
          ? "Admin roles cannot be changed"
          : isCurator
            ? "Demote to User"
            : "Promote to Curator"
      }
    >
      <IconButton
        variant="ghost"
        color={isCurator ? "tomato" : undefined}
        onClick={onClick}
        disabled={role === "admin"}
      >
        {isCurator ? <PiUserMinus /> : <PiUserPlus />}
      </IconButton>
    </ResponsiveTooltip>
  );
}
