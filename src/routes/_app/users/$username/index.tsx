import { Avatar, Button, Flex, Heading, Text } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { RoleBadge } from "../../../../components/UserBadge";
import { generateLoginRedirectFromLocation } from "../../../../lib/auth/utils";
import { UserDTO } from "../../../../lib/domain/users/types";
import {
  meQueryOptions,
  userQueryOptions,
} from "../../../../lib/queries/users";
import { getInitials } from "../../../../lib/utils/getInitials";

export const Route = createFileRoute("/_app/users/$username/")({
  loader: async ({ location, context, params }) => {
    let effectiveUsername = params.username;
    let isMe = false;

    const me = await context.queryClient.fetchQuery(meQueryOptions());
    if (params.username === "me") {
      if (!me) {
        throw generateLoginRedirectFromLocation(location);
      }
      effectiveUsername = me.username;
    }

    if (me?.username === effectiveUsername) isMe = true;

    await context.queryClient.ensureQueryData(
      userQueryOptions(effectiveUsername)
    );

    return { effectiveUsername, isMe };
  },

  component: UserProfilePage,
});

function preferredDisplay(u: UserDTO) {
  return u.name?.trim() || u.displayUsername || u.username;
}

function UserProfilePage() {
  const { effectiveUsername, isMe } = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const { data: user } = useSuspenseQuery(userQueryOptions(effectiveUsername));

  const joined = new Date(user.createdAt).toLocaleDateString();

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
              <RoleBadge role={user.role} ml="2" />
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
            {user.description ??
              `${preferredDisplay(user)} has not added a description yet.`}
          </p>
        </div>
      </section>

      {isMe && <Button onClick={() => navigate({ to: "edit" })}>Edit</Button>}
    </div>
  );
}
