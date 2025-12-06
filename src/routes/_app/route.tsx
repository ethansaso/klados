import { Flex, Strong, Text } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import "@xyflow/react/dist/style.css";
import { Footer } from "../../components/Footer";
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
      <Flex justify="center" style={{ background: "var(--tomato-5)" }}>
        <Text color="tomato">
          <Strong>Note:</Strong> Klados is still under active development. Data
          may be lost at any time, and features may be incomplete.
        </Text>
      </Flex>
      <NavBar user={user} />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
