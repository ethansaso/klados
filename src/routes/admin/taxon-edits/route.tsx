import { Box } from "@radix-ui/themes";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminSectionHeader } from "../-components/AdminSectionHeader";

export const Route = createFileRoute("/admin/taxon-edits")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Box flexGrow="1">
      <AdminSectionHeader>Taxon Edits</AdminSectionHeader>
      <Outlet />
    </Box>
  );
}
