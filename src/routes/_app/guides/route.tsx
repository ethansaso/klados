import { createFileRoute, Outlet } from "@tanstack/react-router";

import reactFlowCssUrl from "../../../assets/styles/react-flow/nodes.css?url";

export const Route = createFileRoute("/_app/guides")({
  head: () => ({
    links: [{ rel: "stylesheet", href: reactFlowCssUrl }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
