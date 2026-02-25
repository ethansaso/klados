import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/glossary/")({
  beforeLoad: () => {
    throw redirect({
      to: "/glossary/features",
    });
  },
  component: RouteComponent,
});

function RouteComponent() {
  return null;
}
