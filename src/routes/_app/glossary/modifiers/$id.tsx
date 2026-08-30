import NiceModal from "@ebay/nice-modal-react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  TextField,
} from "@radix-ui/themes";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { PiMagnifyingGlass, PiTrash } from "react-icons/pi";
import z from "zod";
import { CuratorOnly } from "../../../../components/CuratorOnly";
import { ConfirmDeleteModal } from "../../../../components/dialogs/ConfirmDeleteModal";
import { DebouncedTextField } from "../../../../components/inputs/DebouncedTextField";
import { PaginationFooter } from "../../../../components/PaginationFooter";
import { roleHasCuratorRights } from "../../../../lib/auth/utils";
import type { ModifierDTO } from "../../../../lib/domain/modifiers/types";
import {
  modifierGroupQueryOptions,
  modifiersQueryOptions,
} from "../../../../lib/queries/modifiers";
import { deleteModifierFn } from "../../../../lib/server-fns/modifiers/deleteModifierFn";
import { deleteModifierGroupFn } from "../../../../lib/server-fns/modifiers/deleteModifierGroupFn";
import { toast } from "../../../../lib/utils/toast";
import ModifierTable from "./-ModifierTable";

const SearchSchema = z.object({
  valuePage: z.coerce.number().int().positive().default(1).catch(1),
  valueQ: z.string().default("").catch(""),
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
        valueQ: "",
      }),
    ],
  },
  loaderDeps: ({ search }) => ({
    page: search.valuePage,
    q: search.valueQ,
  }),
  loader: async ({ context, params, deps: { page, q } }) => {
    const { id } = params;
    await Promise.all([
      context.queryClient.ensureQueryData(modifierGroupQueryOptions(id)),
      context.queryClient.ensureQueryData(
        modifiersQueryOptions(id, page, PAGE_SIZE, { q: q || undefined }),
      ),
    ]);
    return { id, page, q, isCurator: roleHasCuratorRights(context.user?.role) };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { id, page, q, isCurator } = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const qc = useQueryClient();
  const search = Route.useSearch();
  const serverDeleteModifier = useServerFn(deleteModifierFn);
  const serverDeleteGroup = useServerFn(deleteModifierGroupFn);

  const { data: modifierGroup } = useSuspenseQuery(
    modifierGroupQueryOptions(id),
  );
  const { data: modifiersPage } = useSuspenseQuery(
    modifiersQueryOptions(id, page, PAGE_SIZE, { q: q || undefined }),
  );

  // A new query invalidates the current page number along with the results
  const setQ = (value: string) => {
    navigate({ search: { valuePage: 1, valueQ: value } });
  };

  const goToPage = (nextPage: number) => {
    navigate({
      search: {
        valuePage: nextPage,
        valueQ: q,
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
          <DebouncedTextField
            size="2"
            placeholder="Search values..."
            value={q}
            onDebouncedChange={setQ}
            radius="large"
          >
            <TextField.Slot>
              <PiMagnifyingGlass size="16" />
            </TextField.Slot>
          </DebouncedTextField>
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
