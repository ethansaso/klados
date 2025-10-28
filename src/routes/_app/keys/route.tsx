import { createFileRoute } from "@tanstack/react-router";
import { ContentContainer } from "../../../components/ContentContainer";

export const Route = createFileRoute("/_app/keys")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ContentContainer />;
}
