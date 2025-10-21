import { Avatar, Badge, Flex, Heading, Text } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo } from "react";
import { meQuery, userQueryOptions } from "../../../../lib/queries/user";
import { UserDTO } from "../../../../lib/serverFns/user";
import { capitalizeWord } from "../../../../lib/utils/capitalizeWord";
import { getInitials } from "../../../../lib/utils/getInitials";

export const Route = createFileRoute("/_app/users/$username/")({
  loader: async ({ context, params }) => {
    let effectiveUsername = params.username;
    if (params.username === "me") {
      const me = await context.queryClient.fetchQuery(meQuery());
      if (!me) throw redirect({ to: "/login" });
      effectiveUsername = me.username;
    }

    await context.queryClient.ensureQueryData(
      userQueryOptions(effectiveUsername)
    );

    return { effectiveUsername };
  },

  component: UserProfilePage,
});

function preferredDisplay(u: UserDTO) {
  return u.name?.trim() || u.displayUsername || u.username;
}

function UserProfilePage() {
  const { effectiveUsername } = Route.useLoaderData();
  const { data: user } = useSuspenseQuery(userQueryOptions(effectiveUsername));

  const joined = useMemo(() => {
    try {
      return new Date(user.createdAt).toLocaleDateString();
    } catch {
      return "";
    }
  }, [user.createdAt]);

  return (
    <div>
      <header>
        <Flex align="start" gap="4">
          <Avatar
            src={user.image ?? undefined}
            fallback={getInitials(user.name)}
            alt={`${preferredDisplay(user)}`}
            size="7"
            radius="none"
          />
          <Flex direction="column" gap="0">
            <Heading size="7">{preferredDisplay(user)}</Heading>
            <Flex align="center">
              <Text as="div" color="gray">
                @{user.username}
              </Text>
              {user.role !== "user" && (
                <Badge
                  variant="soft"
                  color={user.role === "admin" ? "tomato" : undefined}
                  ml="2"
                >
                  {capitalizeWord(user.role)}
                </Badge>
              )}
            </Flex>
            <Text as="div" color="gray">
              Joined {joined}
            </Text>
          </Flex>
        </Flex>
      </header>

      <section style={{ marginTop: 24 }}>
        <div style={{ marginTop: 24 }}>
          <p>
            This is the user's public profile. Add sections like curated taxa,
            recent activity, etc.
          </p>
        </div>
      </section>
    </div>
  );
}
