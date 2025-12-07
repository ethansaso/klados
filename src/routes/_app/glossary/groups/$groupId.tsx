import { Box, Heading, Text } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { characterGroupQueryOptions } from "../../../../lib/queries/characterGroups";

const ParamsSchema = z.object({
  groupId: z.coerce.number().int().positive(),
});

export const Route = createFileRoute("/_app/glossary/groups/$groupId")({
  params: ParamsSchema,
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      characterGroupQueryOptions(params.groupId)
    );
    return params;
  },
  component: RouteComponent,
});

function RouteComponent() {
  // const search = CharacterGroupsLayoutRoute.useSearch();
  const { groupId } = Route.useLoaderData();
  // const navigate = useNavigate();
  // const qc = useQueryClient();

  const { data: group } = useSuspenseQuery(characterGroupQueryOptions(groupId));

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
            {/* TODO: fix this */}
            <Text as="div">{char.description}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
