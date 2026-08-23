import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  generateLoginRedirectFromLocation,
  roleHasCuratorRights,
} from "../../../../../lib/auth/utils";
import "./route.css";

export const Route = createFileRoute("/_app/taxa/$id/edit")({
  beforeLoad: async ({ context, location }) => {
    if (!roleHasCuratorRights(context.user?.role)) {
      throw generateLoginRedirectFromLocation(location);
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
