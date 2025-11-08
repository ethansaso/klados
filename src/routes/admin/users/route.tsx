import { Box } from "@radix-ui/themes";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminSectionHeader } from "../-components/AdminSectionHeader";

export const Route = createFileRoute("/admin/users")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Box flexGrow="1">
      <AdminSectionHeader size="2">Users</AdminSectionHeader>
      <Outlet />
    </Box>
  );
}
