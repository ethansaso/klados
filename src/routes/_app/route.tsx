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
      <NavBar user={user} />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
