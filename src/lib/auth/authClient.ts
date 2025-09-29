import { createAuthClient } from "better-auth/react";
import { usernameClient, adminClient } from "better-auth/client/plugins"
import { ac } from "./permissions";
import { user as userRole, curator as curatorRole, admin as adminRole } from "./permissions";

export const authClient = createAuthClient({
  plugins: [
    usernameClient(),
    adminClient({
      ac,
      roles: { user: userRole, curator: curatorRole, admin: adminRole },
    }),
  ]
});

// Convenience re-exports
export const { useSession } = authClient;