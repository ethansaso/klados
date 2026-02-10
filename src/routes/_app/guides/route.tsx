import "../../../assets/styles/react-flow/nodes.css";
import "../../../assets/styles/react-flow/override.css";

import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/guides")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
