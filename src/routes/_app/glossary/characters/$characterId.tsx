import NiceModal from "@ebay/nice-modal-react";
import { Box, Heading, IconButton, Text } from "@radix-ui/themes";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { PiTrash } from "react-icons/pi";
import z from "zod";
import { ConfirmDeleteModal } from "../../../../components/dialogs/ConfirmDeleteModal";
import { characterQueryOptions } from "../../../../lib/queries/characters";
import { deleteCharacter } from "../../../../lib/serverFns/characters/fns";
import { CharacterDetailDTO } from "../../../../lib/serverFns/characters/types";
import { capitalizeWord } from "../../../../lib/utils/casing";
import { toast } from "../../../../lib/utils/toast";
import { Route as CharactersLayoutRoute } from "./route";

const ParamsSchema = z.object({
  characterId: z.coerce.number().int().positive(),
});

export const Route = createFileRoute("/_app/glossary/characters/$characterId")({
  loader: async ({ context, params }) => {
    const { characterId } = ParamsSchema.parse(params);
    return { characterId };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const search = CharactersLayoutRoute.useSearch();
  const { characterId } = Route.useLoaderData();
  const serverDelete = useServerFn(deleteCharacter);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const {
    data: character,
    error: osErr,
    isLoading: osLoad,
  } = useQuery(characterQueryOptions(characterId));

  const handleTraitSetDeleteClick = (character: CharacterDetailDTO) => {
    NiceModal.show(ConfirmDeleteModal, {
      label: character.label,
      itemType: "character",
      onConfirm: async () => {
        try {
          await serverDelete({ data: { id: character.id } });
          qc.invalidateQueries({ queryKey: ["characters"] });
          qc.invalidateQueries({
            queryKey: characterQueryOptions(character.id).queryKey,
          });
          navigate({
            to: "/glossary/characters",
            search,
          });
          toast({
            variant: "success",
            description: `Character "${character.label}" deleted successfully.`,
          });
        } catch (error) {
          toast({
            variant: "error",
            description: `Failed to delete character "${character.label}".`,
          });
        }
      },
    });
  };

  if (osLoad) return <div>Loading...</div>;
  if (osErr || !character) return <div>Character not found.</div>;
  return (
    <Box>
      <Heading size="6">Character: {character.label}</Heading>
      <Text as="div" size="2" color="gray">
        {capitalizeWord(character.type)}
      </Text>
      {character.type === "categorical" && (
        <Text as="div" size="2" color="gray">
          Trait set: "{character.traitSet.label}"
        </Text>
      )}
      <Text>{character.description}</Text>
      <Box>
        <IconButton
          size="1"
          color="tomato"
          onClick={() => handleTraitSetDeleteClick(character)}
        >
          <PiTrash />
        </IconButton>
      </Box>
    </Box>
  );
}
