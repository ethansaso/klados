import { createFileRoute, Outlet } from "@tanstack/react-router";
import { getMeFn } from "../../../../../lib/api/users/getMe";
import { generateLoginRedirectFromLocation } from "../../../../../lib/auth/utils";

export const Route = createFileRoute("/_app/taxa/$id/edit")({
  beforeLoad: async ({ location }) => {
    const user = await getMeFn();
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
