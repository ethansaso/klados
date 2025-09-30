import { createFileRoute, Outlet } from '@tanstack/react-router'
import { usersQueryOptions } from '../../../lib/queries/user';
import { Box, Heading } from '@radix-ui/themes';
import { AdminSectionHeader } from '../-components/AdminSectionHeader';

export const Route = createFileRoute("/admin/users")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Box flexGrow="1">
    <AdminSectionHeader size="2">Users</AdminSectionHeader>
    <Outlet />
  </Box>
}
