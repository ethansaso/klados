import { createFileRoute } from "@tanstack/react-router";
import { ContentOutlet } from "../../../components/ContentContainer";

export const Route = createFileRoute("/_app/users")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ContentOutlet />;
}
