import { createFileRoute, Outlet } from "@tanstack/react-router";
import { NavBar } from "../../components/nav/NavBar";

export const Route = createFileRoute("/_app")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <NavBar />
      <main>
        <Outlet />
      </main>
    </>
  );
}
