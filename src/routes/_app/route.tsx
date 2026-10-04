import { createFileRoute, Outlet } from "@tanstack/react-router";
import "@xyflow/react/dist/style.css";
import { Footer } from "../../components/nav/Footer";
import { NavBar } from "../../components/nav/NavBar";
import { NotFound } from "../../components/NotFound";

export const Route = createFileRoute("/_app")({
  component: RouteComponent,
  notFoundComponent: NotFound,
});

function RouteComponent() {
  return (
    <>
      <NavBar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
