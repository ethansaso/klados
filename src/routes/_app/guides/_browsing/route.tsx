import { createFileRoute } from "@tanstack/react-router";
import { ContentOutlet } from "../../../../components/ContentContainer";

export const Route = createFileRoute("/_app/guides/_browsing")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ContentOutlet />;
}
