import { Box, Heading, Text } from "@radix-ui/themes";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import z from "zod";
import { characterGroupQueryOptions } from "../../../../lib/queries/characterGroups";
import { Route as CharacterGroupsLayoutRoute } from "./route";

const ParamsSchema = z.object({
  groupId: z.coerce.number().int().positive(),
});

export const Route = createFileRoute("/_app/glossary/groups/$groupId")({
  loader: async ({ context, params }) => {
    const { groupId } = ParamsSchema.parse(params);
    return { groupId };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const search = CharacterGroupsLayoutRoute.useSearch();
  const { groupId } = Route.useLoaderData();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const {
    data: group,
    error: osErr,
    isLoading: osLoad,
  } = useQuery(characterGroupQueryOptions(groupId));

  if (osLoad) return <div>Loading...</div>;
  if (osErr || !group) return <div>Group not found.</div>;
  return (
    <Box>
      <Heading size="6">Group: {group.label}</Heading>
      <Text>{group.description}</Text>
      <Box>
        {group.characters.map((char) => (
          <Box key={char.id} mb="2">
            <Text as="div" weight="medium">
              {char.label}
            </Text>
            <Text as="div">{char.description}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
