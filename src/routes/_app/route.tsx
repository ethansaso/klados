import { createFileRoute, Outlet } from "@tanstack/react-router";
import { NavBar } from "../../components/nav/NavBar";
import { getMe } from "../../lib/serverFns/user";
import { meQuery } from "../../lib/queries/user";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_app")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(meQuery());
  },
  component: RouteComponent,
});


function RouteComponent() {
  const { data: user } = useQuery(meQuery());

  return (
    <>
      <NavBar user={user} />
      <main>
        <Outlet />
      </main>
    </>
  );
}
