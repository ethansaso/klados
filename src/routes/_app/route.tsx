import { Flex, Strong, Text } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import "@xyflow/react/dist/style.css";
import { Footer } from "../../components/nav/Footer";
import { NavBar } from "../../components/nav/NavBar";
import { NotFound } from "../../components/NotFound";
import { meQueryOptions } from "../../lib/queries/users";

export const Route = createFileRoute("/_app")({
  component: RouteComponent,
  notFoundComponent: NotFound,
});

function RouteComponent() {
  const { data: user } = useSuspenseQuery(meQueryOptions());

  return (
    <>
      <Flex
        justify="center"
        px="2"
        py={{ initial: "1", sm: "0" }}
        style={{ background: "var(--tomato-5)" }}
      >
        <Text color="tomato">
          <Strong>Note:</Strong> Klados is still under active development.
          Features and layout are incomplete, and data may be lost at any time.
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
