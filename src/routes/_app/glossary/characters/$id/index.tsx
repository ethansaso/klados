import NiceModal from "@ebay/nice-modal-react";
import {
  Box,
  Flex,
  Heading,
  IconButton,
  Text,
  TextField,
} from "@radix-ui/themes";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  stripSearchParams,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { PiPencil, PiPlus, PiTrash } from "react-icons/pi";
import z from "zod";
import CategoricalTraitTable from "../-CategoricalTraitTable";
import { DeleteTraitValueModal } from "../-modal/-DeleteTraitValueModal";
import { EditTraitValueModal } from "../-modal/-EditTraitSetValueModal";
import { CuratorOnly } from "../../../../../components/CuratorOnly";
import { ConfirmDeleteModal } from "../../../../../components/dialogs/ConfirmDeleteModal";
import { CharacterIcon } from "../../../../../components/icons/modular/CharacterIcon";
import { PaginationFooter } from "../../../../../components/PaginationFooter";
import { deleteCharacterFn } from "../../../../../lib/api/characters/deleteCharacterFn";
import { createTraitValueFn } from "../../../../../lib/api/traits/createTraitValueFn";
import { roleHasCuratorRights } from "../../../../../lib/auth/utils";
import type { CharacterDetailDTO } from "../../../../../lib/domain/characters/types";
import { characterQueryOptions } from "../../../../../lib/queries/characters";
import { traitValuesQueryOptions } from "../../../../../lib/queries/traits";
import { capitalizeFirstLetter } from "../../../../../lib/utils/formatting/casing";
import { getErrorMessage } from "../../../../../lib/utils/getErrorMessage";
import { toast } from "../../../../../lib/utils/toast";
import { Route as CharactersLayoutRoute } from "../route";

const SearchSchema = z.object({
  valuePage: z.coerce.number().int().positive().default(1).catch(1),
});

const TRAIT_PAGE_SIZE = 10;

export const Route = createFileRoute("/_app/glossary/characters/$id/")({
  validateSearch: SearchSchema,
  search: {
    middlewares: [
      stripSearchParams({
        valuePage: 1,
      }),
    ],
  },
  loaderDeps: ({ search }) => ({
    traitPage: search.valuePage,
  }),
  loader: async ({ context, params, deps: { traitPage } }) => {
    await context.queryClient.ensureQueryData(
      traitValuesQueryOptions(params.id, traitPage, TRAIT_PAGE_SIZE),
    );
    return {
      id: params.id,
      isCurator: roleHasCuratorRights(context.user?.role),
      traitPage,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const search = CharactersLayoutRoute.useSearch();
  const { id, isCurator, traitPage } = Route.useLoaderData();
  const serverDelete = useServerFn(deleteCharacterFn);
  const serverCreateTrait = useServerFn(createTraitValueFn);
  const navigate = Route.useNavigate();
  const qc = useQueryClient();
  const [newTraitLabel, setNewTraitLabel] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleAddTrait = async () => {
    const label = newTraitLabel.trim();
    if (!label || isCreating) return;
    setIsCreating(true);
    try {
      const key = label.toLowerCase().replace(/\s+/g, "_");
      const created = await serverCreateTrait({
        data: { characterId: id, label, key },
      });
      qc.invalidateQueries({ queryKey: ["traitValues"] });
      setNewTraitLabel("");
      toast({
        variant: "success",
        description: `Trait "${created.label}" added.`,
      });
    } catch (e: unknown) {
      const message = getErrorMessage(e);
      toast({ variant: "error", description: message });
    } finally {
      setIsCreating(false);
    }
  };

  const { data: character } = useSuspenseQuery(characterQueryOptions(id));
  const { data: traitValuesPage } = useSuspenseQuery(
    traitValuesQueryOptions(id, traitPage, TRAIT_PAGE_SIZE),
  );

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

  // Propagates canonical values' hexcodes to their aliases.
  const aliasCorrectedValues = useMemo(
    () =>
      traitValuesPage.items.map((val) => {
        if (!val.aliasOf) {
          return val;
        }
        return {
          ...val,
          hexCode: val.aliasOf?.hexCode || null,
        };
      }),
    [traitValuesPage.items],
  );

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
              <IconButton size="1" asChild>
                <Link
                  to="/glossary/characters/$id/edit"
                  params={{ id: character.id }}
                >
                  <PiPencil />
                </Link>
              </IconButton>
              <IconButton
                size="1"
                color="tomato"
                onClick={() => handleCharacterDeleteClick(character)}
              >
                <PiTrash />
              </IconButton>
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
      {character.type === "categorical" ? (
        <Box>
          <Flex align="center" justify="between" mb="2">
            <Heading size="4">Possible Traits</Heading>
            {isCurator && (
              <TextField.Root
                size="2"
                placeholder="Add a new trait..."
                value={newTraitLabel}
                onChange={(e) => setNewTraitLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTrait();
                  }
                }}
              >
                <TextField.Slot side="right">
                  <IconButton
                    size="1"
                    variant="ghost"
                    onClick={handleAddTrait}
                    disabled={!newTraitLabel.trim() || isCreating}
                    loading={isCreating}
                  >
                    <PiPlus />
                  </IconButton>
                </TextField.Slot>
              </TextField.Root>
            )}
          </Flex>
          <CategoricalTraitTable
            values={aliasCorrectedValues}
            showActions={isCurator}
            onEditClick={(value) =>
              NiceModal.show(EditTraitValueModal, {
                traitValue: value,
                invalidate: () =>
                  qc.invalidateQueries({
                    queryKey: ["traitValues"],
                  }),
              })
            }
            onDeleteClick={(value) =>
              NiceModal.show(DeleteTraitValueModal, {
                value,
                invalidate: () =>
                  qc.invalidateQueries({
                    queryKey: ["traitValues"],
                  }),
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
