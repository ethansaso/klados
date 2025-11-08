import { createFileRoute, redirect } from "@tanstack/react-router";
import { authClient } from "../../lib/auth/authClient";
import { meQuery } from "../../lib/queries/users";

export const Route = createFileRoute("/_app/logout")({
  beforeLoad: async ({ context }) => {
    await authClient.signOut();
    context.queryClient.setQueryData(meQuery().queryKey, null);
    context.queryClient.invalidateQueries({ queryKey: meQuery().queryKey });
    throw redirect({ to: "/" });
  },
  component: () => null,
});
