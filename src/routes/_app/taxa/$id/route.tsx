import "../../../../assets/styles/pages/taxa/shared.css";

import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/taxa/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
