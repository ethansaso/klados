import { createFileRoute, Outlet } from "@tanstack/react-router";

import sharedCssUrl from "../../../../assets/styles/pages/taxa/shared.css?url";

export const Route = createFileRoute("/_app/taxa/$id")({
  head: () => ({
    links: [{ rel: "stylesheet", href: sharedCssUrl }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
