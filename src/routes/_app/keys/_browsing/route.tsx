import { createFileRoute } from "@tanstack/react-router";
import { ContentContainer } from "../../../../components/ContentContainer";

export const Route = createFileRoute("/_app/keys/_browsing")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ContentContainer />;
}
