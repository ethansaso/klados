import { createFileRoute, useLoaderData, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Avatar } from "@radix-ui/themes";
import { getInitials } from "../../../../lib/utils/getInitials";
import { UserDTO } from "../../../../lib/serverFns/user";

export const Route = createFileRoute("/_app/users/$username/")({
  // Loader runs on server for SSR and can refetch on client as needed.
  // Using the API keeps DB code server-only.
  loader: async ({ params, location }) => {
    const res = await fetch(`/api/users/${encodeURIComponent(params.username)}`, {
      headers: {
        // Forward cookies for SSR hydration correctness (helps auth-related UIs if added)
        cookie: typeof document === "undefined" ? (location.state as any)?.cookie ?? "" : document.cookie,
      },
    });

    if (res.status === 404) {
      throw new Response("User not found", { status: 404 });
    }
    if (!res.ok) {
      throw new Response("Failed to load user", { status: 500 });
    }

    const user = (await res.json()) as UserDTO;
    return { user };
  },

  component: UserProfilePage,
});

function preferredDisplay(u: UserDTO) {
  return u.name?.trim() || u.displayUsername || u.username;
}

function UserProfilePage() {
  const { user } = useLoaderData({ from: Route.id }) as { user: UserDTO };

  const joined = useMemo(() => {
    try {
      // createdAt comes back as ISO string from the API
      return new Date(user.createdAt).toLocaleDateString();
    } catch {
      return "";
    }
  }, [user.createdAt]);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "24px" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Avatar
          src={user.image ?? undefined}
          fallback={getInitials(user.name)}
          alt={`${preferredDisplay(user)}`}
          style={{borderRadius: 0}}
        />
        <div>
          <h1 style={{ margin: 0 }}>{preferredDisplay(user)}</h1>
          <div style={{ color: "var(--gray-11)" }}>@{user.username}</div>
          {joined ? <div style={{ color: "var(--gray-10)", marginTop: 4 }}>Joined {joined}</div> : null}
        </div>
      </header>

      <section style={{ marginTop: 24 }}>
        <div style={{ marginTop: 24 }}>
          <p>This is the user's public profile. Add sections like curated taxa, recent activity, etc.</p>
        </div>
      </section>
    </main>
  );
}
