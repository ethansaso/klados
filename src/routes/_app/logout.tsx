import { createFileRoute, redirect } from "@tanstack/react-router";
import { authClient } from "../../lib/auth/authClient";

export const Route = createFileRoute("/_app/logout")({
  beforeLoad: async () => {
    await authClient.signOut();
    throw redirect({ to: "/" });
  },
  component: () => null,
});
