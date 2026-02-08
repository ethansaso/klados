import { Box, Heading, Link as RadixLink, Text } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import z from "zod";
import { characterGroupQueryOptions } from "../../../../lib/queries/characterGroups";

const ParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const Route = createFileRoute("/_app/glossary/groups/$id")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex,follow" }],
  }),
  params: ParamsSchema,
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      characterGroupQueryOptions(params.id),
    );
    return params;
  },
  component: RouteComponent,
});

function RouteComponent() {
  // const search = CharacterGroupsLayoutRoute.useSearch();
  const { id } = Route.useLoaderData();
  // const navigate = useNavigate();
  // const qc = useQueryClient();

  const { data: group } = useSuspenseQuery(characterGroupQueryOptions(id));

  return (
    <Box>
      <Heading size="6">Group: {group.label}</Heading>
      <Text>{group.description}</Text>
      <Box>
        {group.characters.map((char) => (
          <Box key={char.id} mb="2">
            <RadixLink asChild>
              <Link to="/glossary/characters/$id" params={{ id: char.id }}>
                {char.label}
              </Link>
            </RadixLink>
            <Text as="div">{char.description}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
