import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import "@xyflow/react/dist/style.css";
import { NavBar } from "../../components/nav/NavBar";
import { meQueryOptions } from "../../lib/queries/users";

export const Route = createFileRoute("/_app")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(meQueryOptions());
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { data: user } = useSuspenseQuery(meQueryOptions());

  return (
    <>
      <NavBar user={user} />
      {/* <Flex justify="center" style={{ background: "var(--tomato-5)" }}>
        <Text color="tomato">
          <Strong>Note:</Strong> This is a development version of Klados. Data
          may be lost at any time, and features may be incomplete.
        </Text>
      </Flex> */}
      <main>
        <Outlet />
      </main>
      {/* <Footer /> */}
    </>
  );
}
