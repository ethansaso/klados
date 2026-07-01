import NiceModal from "@ebay/nice-modal-react";
import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Text,
  TextField,
} from "@radix-ui/themes";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PiPlus, PiTrash } from "react-icons/pi";
import z from "zod";
import { type AffixType } from "../../../../../db/schema/schema";
import { CuratorOnly } from "../../../../components/CuratorOnly";
import { ConfirmDeleteModal } from "../../../../components/dialogs/ConfirmDeleteModal";
import { ModifierIcon } from "../../../../components/icons/modular/ModifierIcon";
import { PaginationFooter } from "../../../../components/PaginationFooter";
import { roleHasCuratorRights } from "../../../../lib/auth/utils";
import type { ModifierDTO } from "../../../../lib/domain/modifiers/types";
import {
  modifierGroupQueryOptions,
  modifiersQueryOptions,
} from "../../../../lib/queries/modifiers";
import { createModifierFn } from "../../../../lib/server-fns/modifiers/createModifierFn";
import { deleteModifierFn } from "../../../../lib/server-fns/modifiers/deleteModifierFn";
import { deleteModifierGroupFn } from "../../../../lib/server-fns/modifiers/deleteModifierGroupFn";
import { capitalizeFirstLetter } from "../../../../lib/utils/formatting/casing";
import { toast } from "../../../../lib/utils/toast";
import ModifierTable from "./-ModifierTable";

const SearchSchema = z.object({
  valuePage: z.coerce.number().int().positive().default(1).catch(1),
});

const PAGE_SIZE = 10;

export const Route = createFileRoute("/_app/glossary/modifiers/$id")({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  validateSearch: SearchSchema,
  search: {
    middlewares: [
      stripSearchParams({
        valuePage: 1,
      }),
    ],
  },
  loaderDeps: ({ search }) => ({
    page: search.valuePage,
  }),
  loader: async ({ context, params, deps: { page } }) => {
    const { id } = params;
    await Promise.all([
      context.queryClient.ensureQueryData(modifierGroupQueryOptions(id)),
      context.queryClient.ensureQueryData(
        modifiersQueryOptions(id, page, PAGE_SIZE),
      ),
    ]);
    return { id, page, isCurator: roleHasCuratorRights(context.user?.role) };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { id, page, isCurator } = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const qc = useQueryClient();
  const search = Route.useSearch();
  const serverCreateModifier = useServerFn(createModifierFn);
  const serverDeleteModifier = useServerFn(deleteModifierFn);
  const serverDeleteGroup = useServerFn(deleteModifierGroupFn);
  const [newValue, setNewValue] = useState("");
  const [newAffixType, setNewAffixType] = useState<AffixType>("prefix");
  const [isCreating, setIsCreating] = useState(false);

  const { data: modifierGroup } = useSuspenseQuery(
    modifierGroupQueryOptions(id),
  );
  const { data: modifiersPage } = useSuspenseQuery(
    modifiersQueryOptions(id, page, PAGE_SIZE),
  );

  const handleSwitchAffix = () => {
    setNewAffixType((prev) => (prev === "prefix" ? "suffix" : "prefix"));
  };

  const handleAddModifier = async () => {
    const value = newValue.trim();
    if (!value || isCreating) return;
    setIsCreating(true);
    try {
      const created = await serverCreateModifier({
        data: { groupId: id, value, affixType: newAffixType },
      });
      qc.invalidateQueries({ queryKey: ["modifiers"] });
      setNewValue("");
      toast({
        variant: "success",
        description: `Modifier "${created.value}" added.`,
      });
    } catch {
      toast({ variant: "error", description: "Failed to add modifier." });
    } finally {
      setIsCreating(false);
    }
  };

  const goToPage = (nextPage: number) => {
    navigate({
      search: {
        valuePage: nextPage,
      },
    });
  };

  const handleDeleteGroupClick = () => {
    NiceModal.show(ConfirmDeleteModal, {
      label: modifierGroup.label,
      itemType: "modifier group",
      onConfirm: async () => {
        try {
          await serverDeleteGroup({ data: { id: modifierGroup.id } });
          qc.invalidateQueries({ queryKey: ["modifierGroups"] });
          qc.invalidateQueries({
            queryKey: modifierGroupQueryOptions(modifierGroup.id).queryKey,
          });
          navigate({
            to: "/glossary/modifiers",
            search,
          });
          toast({
            variant: "success",
            description: `Modifier group "${modifierGroup.label}" deleted successfully.`,
          });
        } catch {
          toast({
            variant: "error",
            description: `Failed to delete modifier group "${modifierGroup.label}".`,
          });
        }
      },
    });
  };

  const handleDeleteModifierClick = (modifier: ModifierDTO) => {
    NiceModal.show(ConfirmDeleteModal, {
      label: modifier.value,
      itemType: "modifier",
      onConfirm: async () => {
        try {
          await serverDeleteModifier({ data: { id: modifier.id } });
          qc.invalidateQueries({ queryKey: ["modifiers"] });
          toast({
            variant: "success",
            description: `Modifier "${modifier.value}" deleted successfully.`,
          });
        } catch {
          toast({
            variant: "error",
            description: `Failed to delete modifier "${modifier.value}".`,
          });
        }
      },
    });
  };

  return (
    <Box>
      <Box mb="3">
        <Flex justify="between">
          <Heading>{modifierGroup.label}</Heading>
          <CuratorOnly>
            <Button size="1" onClick={handleDeleteGroupClick} color="tomato">
              <PiTrash />
              Delete
            </Button>
          </CuratorOnly>
        </Flex>
        <Flex gap="1" align="center">
          <Text color="gray" size="2" asChild>
            <ModifierIcon type={modifierGroup.class} />
          </Text>
          <Text size="2" color="gray">
            {capitalizeFirstLetter(modifierGroup.class)}
          </Text>
        </Flex>
      </Box>
      <Text
        as="p"
        color={modifierGroup.description ? undefined : "gray"}
        mb="3"
      >
        {modifierGroup.description || "No description."}
      </Text>
      <Box>
        <Flex align="center" justify="between" mb="2">
          <Heading size="4">Possible Values</Heading>
          <CuratorOnly>
            <TextField.Root
              size="2"
              placeholder="Add a new value..."
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddModifier();
                }
              }}
            >
              <TextField.Slot side="right">
                <IconButton
                  size="1"
                  variant="ghost"
                  color={newAffixType === "prefix" ? "crimson" : "cyan"}
                  onClick={handleSwitchAffix}
                  disabled={isCreating}
                  loading={isCreating}
                >
                  <Flex
                    width="1rem"
                    height="1rem"
                    align="center"
                    justify="center"
                  >
                    {newAffixType === "prefix" ? "P" : "S"}
                  </Flex>
                </IconButton>
              </TextField.Slot>
              <TextField.Slot side="right">
                <IconButton
                  size="1"
                  variant="ghost"
                  onClick={handleAddModifier}
                  disabled={!newValue.trim() || isCreating}
                  loading={isCreating}
                >
                  <PiPlus />
                </IconButton>
              </TextField.Slot>
            </TextField.Root>
          </CuratorOnly>
        </Flex>
        <ModifierTable
          values={modifiersPage.items}
          showActions={isCurator}
          onEditClick={() => {}}
          onDeleteClick={handleDeleteModifierClick}
        />
        <Box mt="4">
          <PaginationFooter
            page={modifiersPage.page}
            pageSize={modifiersPage.pageSize}
            total={modifiersPage.total}
            showTotal
            onPrev={() => goToPage(page - 1)}
            onNext={() => goToPage(page + 1)}
          />
        </Box>
      </Box>
    </Box>
  );
}
