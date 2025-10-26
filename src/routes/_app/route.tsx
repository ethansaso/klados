import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { NavBar } from "../../components/nav/NavBar";
import { meQuery } from "../../lib/queries/user";

// TODO: need to call loader only here, or everywhere? how does this work? also, suspensequery or just loader data?
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
