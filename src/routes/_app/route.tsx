import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import "@xyflow/react/dist/style.css";
import { NavBar } from "../../components/nav/NavBar";
import { meQuery } from "../../lib/queries/users";

export const Route = createFileRoute("/_app")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(meQuery());
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { data: user } = useSuspenseQuery(meQuery());

  return (
    <>
      <NavBar user={user} />
      <main>
        <Outlet />
      </main>
    </>
  );
}
