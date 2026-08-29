import NiceModal from "@ebay/nice-modal-react";
import { Box, Button, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  stripSearchParams,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { PiMagnifyingGlass, PiPencil, PiPlus, PiTrash } from "react-icons/pi";
import z from "zod";
import CategoricalTraitTable from "../-CategoricalTraitTable";
import { AddTraitValueModal } from "../-modal/AddTraitValueModal";
import { DeleteTraitValueModal } from "../-modal/DeleteTraitValueModal";
import { EditTraitValueModal } from "../-modal/EditTraitValueModal";
import { AnnotationBubbleWrap } from "../../../../../components/annotations/AnnotationBubbleWrap";
import { CuratorOnly } from "../../../../../components/CuratorOnly";
import { ConfirmDeleteModal } from "../../../../../components/dialogs/ConfirmDeleteModal";
import { CharacterIcon } from "../../../../../components/icons/modular/CharacterIcon";
import { DebouncedTextField } from "../../../../../components/inputs/DebouncedTextField";
import { PaginationFooter } from "../../../../../components/PaginationFooter";
import { roleHasCuratorRights } from "../../../../../lib/auth/utils";
import type { CharacterDetailDTO } from "../../../../../lib/domain/characters/types";
import { characterQueryOptions } from "../../../../../lib/queries/characters";
import { traitValuesQueryOptions } from "../../../../../lib/queries/traits";
import { deleteCharacterFn } from "../../../../../lib/server-fns/characters/deleteCharacterFn";
import { getMediaUrl } from "../../../../../lib/storage/getMediaUrl";
import { capitalizeFirstLetter } from "../../../../../lib/utils/formatting/casing";
import { toast } from "../../../../../lib/utils/toast";
import { Route as CharactersLayoutRoute } from "../route";

const SearchSchema = z.object({
  valuePage: z.coerce.number().int().positive().default(1).catch(1),
  valueQ: z.string().default("").catch(""),
});

const TRAIT_PAGE_SIZE = 10;

export const Route = createFileRoute("/_app/glossary/characters/$id/")({
  validateSearch: SearchSchema,
  search: {
    middlewares: [
      stripSearchParams({
        valuePage: 1,
        valueQ: "",
      }),
    ],
  },
  loaderDeps: ({ search }) => ({
    traitPage: search.valuePage,
    traitQ: search.valueQ,
  }),
  loader: async ({ context, params, deps: { traitPage, traitQ } }) => {
    await context.queryClient.ensureQueryData(
      traitValuesQueryOptions(params.id, traitPage, TRAIT_PAGE_SIZE, {
        q: traitQ || undefined,
      }),
    );
    return {
      id: params.id,
      isCurator: roleHasCuratorRights(context.user?.role),
      traitPage,
      traitQ,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const search = CharactersLayoutRoute.useSearch();
  const { id, isCurator, traitPage, traitQ } = Route.useLoaderData();
  const serverDelete = useServerFn(deleteCharacterFn);
  const navigate = Route.useNavigate();
  const qc = useQueryClient();

  const { data: character } = useSuspenseQuery(characterQueryOptions(id));
  const { data: traitValuesPage } = useSuspenseQuery(
    traitValuesQueryOptions(id, traitPage, TRAIT_PAGE_SIZE, {
      q: traitQ || undefined,
    }),
  );

  const invalidateTraitValues = () =>
    qc.invalidateQueries({ queryKey: ["traitValues"] });

  // A new query invalidates the current page number along with the results
  const setTraitQ = (value: string) => {
    navigate({ search: { valuePage: 1, valueQ: value } });
  };

  const handleCharacterDeleteClick = (character: CharacterDetailDTO) => {
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

  const totalPages = Math.max(
    1,
    Math.ceil(traitValuesPage.total / TRAIT_PAGE_SIZE),
  );
  const canPrev = traitPage > 1;
  const canNext = traitPage < totalPages;

  const goToTraitPage = (nextPage: number) => {
    navigate({
      search: {
        valuePage: nextPage,
        valueQ: traitQ,
      },
    });
  };

  return (
    <Box>
      <Box mb="3">
        <Flex justify="between" align="start" gap="2">
          <Heading size="6">{character.label}</Heading>
          <CuratorOnly>
            <Flex gap="2">
              <Button size="1" asChild>
                <Link
                  to="/glossary/characters/$id/edit"
                  params={{ id: character.id }}
                >
                  <PiPencil />
                  Edit
                </Link>
              </Button>
              <Button
                size="1"
                color="tomato"
                onClick={() => handleCharacterDeleteClick(character)}
              >
                <PiTrash />
                Delete
              </Button>
            </Flex>
          </CuratorOnly>
        </Flex>
        <Flex gap="1" align="center">
          <Text color="gray" size="2" asChild>
            <CharacterIcon type={character.type} />
          </Text>
          <Text size="2" color="gray">
            {capitalizeFirstLetter(character.type)}
          </Text>
        </Flex>
      </Box>
      <Text as="p" color={character.description ? undefined : "gray"} mb="3">
        {character.description || "No description."}
      </Text>
      {character.media && (
        <AnnotationBubbleWrap media={character.media} spacing="1">
          <Box mb="3">
            <img
              src={getMediaUrl(character.media.storageKey)}
              alt={character.media.title}
              style={{
                width: "128px",
                height: "128px",
                objectFit: "cover",
                borderRadius: "var(--radius-2)",
              }}
            />
          </Box>
        </AnnotationBubbleWrap>
      )}
      {character.type === "categorical" ? (
        <Box>
          <Flex align="center" justify="between" mb="2">
            <Heading size="4">Possible Traits</Heading>
            <Flex align="center" gap="2">
              <CuratorOnly>
                <Button
                  size="2"
                  variant="surface"
                  onClick={() =>
                    NiceModal.show(AddTraitValueModal, {
                      characterId: id,
                      // A fruitless search flows straight into creating it
                      initialLabel: traitQ,
                      invalidate: invalidateTraitValues,
                    })
                  }
                >
                  <PiPlus />
                  Add new
                </Button>
              </CuratorOnly>
              <DebouncedTextField
                size="2"
                placeholder="Search traits..."
                initialValue={traitQ}
                onDebouncedChange={setTraitQ}
                radius="large"
              >
                <TextField.Slot>
                  <PiMagnifyingGlass size="16" />
                </TextField.Slot>
              </DebouncedTextField>
            </Flex>
          </Flex>
          <CategoricalTraitTable
            values={traitValuesPage.items}
            showActions={isCurator}
            onEditClick={(value) =>
              NiceModal.show(EditTraitValueModal, {
                traitValue: value,
                invalidate: invalidateTraitValues,
              })
            }
            onDeleteClick={(value) =>
              NiceModal.show(DeleteTraitValueModal, {
                value,
                invalidate: invalidateTraitValues,
              })
            }
          />
          <PaginationFooter
            page={traitValuesPage.page}
            pageSize={traitValuesPage.pageSize}
            total={traitValuesPage.total}
            showTotal
            onPrev={() => canPrev && goToTraitPage(traitPage - 1)}
            onNext={() => canNext && goToTraitPage(traitPage + 1)}
          />
        </Box>
      ) : (
        <Box>
          <Text size="2" weight="bold">
            Unit family:{" "}
          </Text>
          <Text size="2">"{character.unitFamily.label}"</Text>
        </Box>
      )}
    </Box>
  );
}
