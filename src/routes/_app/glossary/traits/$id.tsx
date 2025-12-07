import NiceModal from "@ebay/nice-modal-react";
import {
  Box,
  Flex,
  Heading,
  IconButton,
  Table,
  Text,
  TextField,
} from "@radix-ui/themes";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { PiPlusCircle, PiTrash } from "react-icons/pi";
import z from "zod";
import { CuratorOnly } from "../../../../components/CuratorOnly";
import { ConfirmDeleteModal } from "../../../../components/dialogs/ConfirmDeleteModal";
import { PaginationFooter } from "../../../../components/PaginationFooter";
import { TraitToken } from "../../../../components/trait-tokens/TraitToken";
import { createTraitValueFn } from "../../../../lib/api/traits/createTraitValue";
import { deleteTraitSetFn } from "../../../../lib/api/traits/deleteTraitSet";
import { TraitSetDTO } from "../../../../lib/domain/traits/types";
import {
  traitSetQueryOptions,
  traitSetValuesPaginatedQueryOptions,
  traitSetValuesQueryOptions,
} from "../../../../lib/queries/traits";
import { snakeCase } from "../../../../lib/utils/casing";
import { toast } from "../../../../lib/utils/toast";
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
// TODO: handle 404s
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

  const { items, total } = traitSetValuesPage;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canPrev = valuePage > 1;
  const canNext = valuePage < totalPages;

  const handleAddValue = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("trig");

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const eValue = formData.get("trait-value");
    if (typeof eValue !== "string") return;

    const trimmedValue = eValue.trim();
    if (!trimmedValue) return;

    try {
      await serverCreate({
        data: {
          set_id: id,
          key: snakeCase(trimmedValue),
          label: trimmedValue,
        },
      });

      toast({ description: "Trait value created.", variant: "success" });
      form.reset();
      qc.invalidateQueries({
        queryKey: traitSetValuesQueryOptions(id).queryKey,
      });
    } catch (error) {
      console.error("Error creating trait value:", error);
    }
  };

  const handleTraitSetDeleteClick = (traitSet: TraitSetDTO) => {
    NiceModal.show(ConfirmDeleteModal, {
      label: traitSet.label,
      itemType: "trait set",
      onConfirm: async () => {
        try {
          await serverDelete({ data: { id: traitSet.id } });
          qc.invalidateQueries({ queryKey: ["traitSets"] });
          qc.invalidateQueries({
            queryKey: traitSetQueryOptions(traitSet.id).queryKey,
          });
          qc.invalidateQueries({
            queryKey: traitSetValuesQueryOptions(traitSet.id).queryKey,
          });
          navigate({
            to: "/glossary/traits",
            search: layoutSearch,
          });
          toast({
            variant: "success",
            description: `Trait set "${traitSet.label}" deleted successfully.`,
          });
        } catch {
          toast({
            variant: "error",
            description: `Failed to delete trait set "${traitSet.label}".`,
          });
        }
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
  const aliasCorrectedValues = items.map((val) => {
    if (val.isCanonical) {
      return val;
    }
    return {
      ...val,
      hexCode: val.aliasTarget?.hexCode || null,
    };
  });

  return (
    <Box flexGrow="1">
      <Box mb="4">
        <Heading size="6">Trait Set: {traitSet.label}</Heading>
        <CuratorOnly>
          <IconButton
            size="1"
            color="tomato"
            onClick={() => handleTraitSetDeleteClick(traitSet)}
          >
            <PiTrash />
          </IconButton>
        </CuratorOnly>
        <Text>{traitSet.description}</Text>
      </Box>
      <CuratorOnly>
        <Flex mb="2" asChild>
          <form onSubmit={handleAddValue}>
            <TextField.Root
              id="trait-value"
              name="trait-value"
              placeholder="Add a new value..."
            >
              <TextField.Slot side="right">
                <IconButton type="submit" size="1">
                  <PiPlusCircle />
                </IconButton>
              </TextField.Slot>
            </TextField.Root>
          </form>
        </Flex>
      </CuratorOnly>
      <Table.Root size="1">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Trait</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Alias of</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {aliasCorrectedValues.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={3}>No values found.</Table.Cell>
            </Table.Row>
          ) : (
            aliasCorrectedValues.map((val) => (
              <Table.Row key={val.id}>
                <Table.Cell>
                  <TraitToken trait={val} isLast />
                </Table.Cell>
                <Table.Cell>
                  {val.isCanonical ? "" : val.aliasTarget?.label}
                </Table.Cell>
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table.Root>
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
