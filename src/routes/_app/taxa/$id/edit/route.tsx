import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getMe } from "../../../../../lib/serverFns/user";

export const Route = createFileRoute("/_app/taxa/$id/edit")({
  beforeLoad: async ({ location }) => {
    const user = await getMe();
    if (!user || user.role !== "admin") {
      throw redirect({ to: "/" });
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
