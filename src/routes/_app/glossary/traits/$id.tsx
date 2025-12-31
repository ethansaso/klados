import NiceModal from "@ebay/nice-modal-react";
import {
  Box,
  Flex,
  Heading,
  IconButton,
  Text,
  TextField,
} from "@radix-ui/themes";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import { PiPlusCircle, PiTrash } from "react-icons/pi";
import z from "zod";
import { CuratorOnly } from "../../../../components/CuratorOnly";
import { ConfirmDeleteModal } from "../../../../components/dialogs/ConfirmDeleteModal";
import { PaginationFooter } from "../../../../components/PaginationFooter";
import { createTraitValueFn } from "../../../../lib/api/traits/createTraitValueFn";
import { deleteTraitSetFn } from "../../../../lib/api/traits/deleteTraitSetFn";
import { useMe } from "../../../../lib/auth/useMe";
import { roleHasCuratorRights } from "../../../../lib/auth/utils";
import { TraitSetDTO } from "../../../../lib/domain/traits/types";
import {
  traitSetQueryOptions,
  traitSetValuesPaginatedQueryOptions,
  traitSetValuesQueryOptions,
} from "../../../../lib/queries/traits";
import { snakeCase } from "../../../../lib/utils/casing";
import { toast } from "../../../../lib/utils/toast";
import { DeleteTraitValueModal } from "./-DeleteTraitValueModal";
import { EditTraitSetValueModal } from "./-EditTraitSetValueModal";
import TraitValuesTable from "./-TraitSetTable";
import { Route as TraitsLayoutRoute } from "./route";

const ParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
const SearchSchema = z.object({
  valuePage: z.coerce.number().int().positive().default(1),
});

const PAGE_SIZE = 10;

export const Route = createFileRoute("/_app/glossary/traits/$id")({
  params: ParamsSchema,
  validateSearch: SearchSchema,
  loaderDeps: ({ search }) => ({
    valuePage: search.valuePage,
  }),
  loader: async ({ context, params, deps: { valuePage } }) => {
    await context.queryClient.ensureQueryData(traitSetQueryOptions(params.id));
    await context.queryClient.ensureQueryData(
      traitSetValuesPaginatedQueryOptions(params.id, valuePage, PAGE_SIZE)
    );
    return { id: params.id, valuePage };
  },
  component: RouteComponent,
});

// TODO: alias, keys, editing, deleting values
function RouteComponent() {
  const layoutSearch = TraitsLayoutRoute.useSearch();
  const { id, valuePage } = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const qc = useQueryClient();

  const serverCreate = useServerFn(createTraitValueFn);
  const serverDelete = useServerFn(deleteTraitSetFn);

  const { data: traitSet } = useSuspenseQuery(traitSetQueryOptions(id));
  const { data: traitSetValuesPage } = useSuspenseQuery(
    traitSetValuesPaginatedQueryOptions(id, valuePage, PAGE_SIZE)
  );
  const { data: me } = useMe();

  const { items, total } = traitSetValuesPage;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canPrev = valuePage > 1;
  const canNext = valuePage < totalPages;

  const invalidateTraitSet = async (setId: number, page: number) => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: traitSetQueryOptions(setId).queryKey }),
      qc.invalidateQueries({
        queryKey: traitSetValuesQueryOptions(setId).queryKey,
      }),
      qc.invalidateQueries({
        queryKey: traitSetValuesPaginatedQueryOptions(setId, page, PAGE_SIZE)
          .queryKey,
      }),
    ]);
  };

  const createValueMutation = useMutation({
    mutationFn: async (label: string) => {
      const trimmedValue = label.trim();
      if (!trimmedValue) {
        throw new Error("Trait value cannot be empty.");
      }

      await serverCreate({
        data: {
          setId: id,
          key: snakeCase(trimmedValue),
          label: trimmedValue,
        },
      });

      return trimmedValue;
    },
    onSuccess: (createdLabel) => {
      toast({
        description: `Trait value "${createdLabel}" created.`,
        variant: "success",
      });
      invalidateTraitSet(id, valuePage);
    },
    onError: (error) => {
      toast({
        variant: "error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create trait value.",
      });
    },
  });

  const deleteTraitSetMutation = useMutation({
    mutationFn: async (traitSet: TraitSetDTO) => {
      await serverDelete({ data: { id: traitSet.id } });
      return traitSet;
    },
    onSuccess: (deletedTraitSet) => {
      invalidateTraitSet(deletedTraitSet.id, valuePage);

      navigate({
        to: "/glossary/traits",
        search: layoutSearch,
      });

      toast({
        variant: "success",
        description: `Trait set "${deletedTraitSet.label}" deleted successfully.`,
      });
    },
    onError: (error, traitSetArg) => {
      toast({
        variant: "error",
        description: `Failed to delete trait set "${traitSetArg.label}".`,
      });
      void error;
    },
  });

  const handleAddValue = (e: React.FormEvent) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const eValue = formData.get("trait-value");
    if (typeof eValue !== "string") return;

    const trimmedValue = eValue.trim();
    if (!trimmedValue) return;

    createValueMutation.mutate(trimmedValue, {
      onSuccess: () => {
        form.reset();
      },
    });
  };

  const handleTraitSetDeleteClick = (traitSet: TraitSetDTO) => {
    NiceModal.show(ConfirmDeleteModal, {
      label: traitSet.label,
      itemType: "trait set",
      onConfirm: async () => {
        await deleteTraitSetMutation.mutateAsync(traitSet);
      },
    });
  };

  const goToPage = (nextPage: number) => {
    navigate({
      search: (prev) => ({
        ...prev,
        valuePage: nextPage,
      }),
    });
  };

  const handlePrev = () => {
    if (!canPrev) return;
    goToPage(valuePage - 1);
  };

  const handleNext = () => {
    if (!canNext) return;
    goToPage(valuePage + 1);
  };

  // Propagates canonical values' hexcodes to their aliases.
  const aliasCorrectedValues = useMemo(
    () =>
      items.map((val) => {
        if (!val.aliasTarget) {
          return val;
        }
        return {
          ...val,
          hexCode: val.aliasTarget?.hexCode || null,
        };
      }),
    [items]
  );

  return (
    <Box flexGrow="1">
      <Flex justify="between" gap="2">
        <Box mb="4">
          <Heading size="6">Trait Set: {traitSet.label}</Heading>
          <Text>{traitSet.description}</Text>
        </Box>
        <CuratorOnly>
          <IconButton
            size="1"
            color="tomato"
            disabled={deleteTraitSetMutation.isPending}
            onClick={() => handleTraitSetDeleteClick(traitSet)}
          >
            <PiTrash />
          </IconButton>
        </CuratorOnly>
      </Flex>

      <CuratorOnly>
        <Flex mb="2" asChild>
          <form onSubmit={handleAddValue}>
            <TextField.Root
              id="trait-value"
              name="trait-value"
              placeholder="Add a new value..."
            >
              <TextField.Slot side="right">
                <IconButton
                  type="submit"
                  size="1"
                  disabled={createValueMutation.isPending}
                >
                  <PiPlusCircle />
                </IconButton>
              </TextField.Slot>
            </TextField.Root>
          </form>
        </Flex>
      </CuratorOnly>

      <TraitValuesTable
        values={aliasCorrectedValues}
        showActions={roleHasCuratorRights(me?.role)}
        onEditClick={(value) => {
          NiceModal.show(EditTraitSetValueModal, {
            traitValue: value,
            invalidate: () => invalidateTraitSet(id, valuePage),
          });
        }}
        onDeleteClick={(value) => {
          NiceModal.show(DeleteTraitValueModal, {
            value,
            invalidate: () => invalidateTraitSet(id, valuePage),
          });
        }}
      />
      <PaginationFooter
        page={valuePage}
        pageSize={PAGE_SIZE}
        total={total}
        showValue
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </Box>
  );
}
