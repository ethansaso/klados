import { createFileRoute, Outlet } from "@tanstack/react-router";
import { generateLoginRedirectFromLocation } from "../../../../../lib/auth/utils";

export const Route = createFileRoute("/_app/taxa/$id/edit")({
  beforeLoad: async ({ context, location }) => {
    const { user } = context;
    if (!user || user.role !== "admin") {
      throw generateLoginRedirectFromLocation(location);
    }
    return {
      user,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
