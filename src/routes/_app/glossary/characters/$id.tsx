import NiceModal from "@ebay/nice-modal-react";
import { Box, Heading, IconButton, Text } from "@radix-ui/themes";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { PiTrash } from "react-icons/pi";
import z from "zod";
import { CuratorOnly } from "../../../../components/CuratorOnly";
import { ConfirmDeleteModal } from "../../../../components/dialogs/ConfirmDeleteModal";
import { deleteCharacterFn } from "../../../../lib/api/characters/deleteCharacter";
import { CharacterDetailDTO } from "../../../../lib/domain/characters/types";
import { characterQueryOptions } from "../../../../lib/queries/characters";
import { capitalizeFirstLetter } from "../../../../lib/utils/casing";
import { toast } from "../../../../lib/utils/toast";
import { Route as CharactersLayoutRoute } from "./route";

const ParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const Route = createFileRoute("/_app/glossary/characters/$id")({
  params: ParamsSchema,
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(characterQueryOptions(params.id));

    return params;
  },
  component: RouteComponent,
});

function RouteComponent() {
  const search = CharactersLayoutRoute.useSearch();
  const { id } = Route.useLoaderData();
  const serverDelete = useServerFn(deleteCharacterFn);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: character } = useSuspenseQuery(characterQueryOptions(id));

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
        } catch {
          toast({
            variant: "error",
            description: `Failed to delete character "${character.label}".`,
          });
        }
      },
    });
  };

  return (
    <Box>
      <Heading size="6">Character: {character.label}</Heading>
      <Text as="div" size="2" color="gray">
        {capitalizeFirstLetter(character.type)}
      </Text>
      {character.type === "categorical" && (
        <Text as="div" size="2" color="gray">
          Trait set: "{character.traitSet.label}"
        </Text>
      )}
      <Text>{character.description}</Text>
      <CuratorOnly>
        <Box>
          <IconButton
            size="1"
            color="tomato"
            onClick={() => handleTraitSetDeleteClick(character)}
          >
            <PiTrash />
          </IconButton>
        </Box>
      </CuratorOnly>
    </Box>
  );
}
