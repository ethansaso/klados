import { Box, Heading, Text } from "@radix-ui/themes";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import z from "zod";
import { characterQueryOptions } from "../../../../lib/queries/characters";
import { Route as CharactersLayoutRoute } from "../route";

const ParamsSchema = z.object({
  characterId: z.coerce.number().int().positive(),
});

export const Route = createFileRoute(
  "/_app/glossary/characters/$characterId"
)({
  loader: async ({ context, params }) => {
    const { characterId } = ParamsSchema.parse(params);
    return { characterId };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const search = CharactersLayoutRoute.useSearch();
  const { characterId } = Route.useLoaderData();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const {
    data: character,
    error: osErr,
    isLoading: osLoad,
  } = useQuery(characterQueryOptions(characterId));

  if (osLoad) return <div>Loading...</div>;
  if (osErr || !character) return <div>Character not found.</div>;
  return (
    <Box>
      <Heading size="6">Character: {character.label}</Heading>
      <Text>{character.description}</Text>
    </Box>
  );
}
