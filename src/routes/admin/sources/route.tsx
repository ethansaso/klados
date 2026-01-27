import { Box } from "@radix-ui/themes";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminSectionHeader } from "../-components/AdminSectionHeader";

export const Route = createFileRoute("/admin/sources")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Box flexGrow="1">
      <AdminSectionHeader>Sources</AdminSectionHeader>
      <Outlet />
    </Box>
  );
}
