import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  loader: async ({ context }) => {
    return {
      user: context.user,
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const user = Route.useLoaderData();
  return <div>Hello "/admin/"!</div>;
}
