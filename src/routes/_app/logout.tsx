import { createFileRoute, redirect } from "@tanstack/react-router";
import { authClient } from "../../lib/auth/authClient";
import { meQueryOptions } from "../../lib/queries/users";

export const Route = createFileRoute("/_app/logout")({
  beforeLoad: async ({ context }) => {
    await authClient.signOut();
    context.queryClient.setQueryData(meQueryOptions().queryKey, null);
    context.queryClient.invalidateQueries({
      queryKey: meQueryOptions().queryKey,
    });
    throw redirect({ to: "/" });
  },
  component: () => null,
});
