import NiceModal from "@ebay/nice-modal-react";
import {
  Box,
  Flex,
  Heading,
  IconButton,
  Separator,
  Text,
  TextField,
} from "@radix-ui/themes";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { PiPlusCircle, PiTrash } from "react-icons/pi";
import z from "zod";
import { ConfirmDeleteModal } from "../../../../../components/dialogs/ConfirmDeleteModal";
import {
  createTraitValue,
  deleteTraitSet,
} from "../../../../../lib/api/traits/fns";
import { TraitSetDTO } from "../../../../../lib/api/traits/types";
import {
  traitSetQueryOptions,
  traitSetValuesQueryOptions,
} from "../../../../../lib/queries/traits";
import { snakeCase } from "../../../../../lib/utils/casing";
import { toast } from "../../../../../lib/utils/toast";
import { Route as TraitsLayoutRoute } from "../route";

const ParamsSchema = z.object({
  setId: z.coerce.number().int().positive(),
});

export const Route = createFileRoute("/_app/glossary/traits/$setId/")({
  loader: async ({ context, params }) => {
    const { setId } = ParamsSchema.parse(params);
    return { setId };
  },
  component: RouteComponent,
});

// TODO: alias, keys, editing, deleting values
// TODO: handle 404s
function RouteComponent() {
  const search = TraitsLayoutRoute.useSearch();
  const { setId } = Route.useLoaderData();
  const serverCreate = useServerFn(createTraitValue);
  const serverDelete = useServerFn(deleteTraitSet);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const {
    data: traitSet,
    error: osErr,
    isLoading: osLoad,
  } = useQuery(traitSetQueryOptions(setId));

  const {
    data: traitSetValues,
    isLoading: osvLoad,
    error: osvError,
  } = useQuery({
    ...traitSetValuesQueryOptions(setId),
    enabled: !osErr, // ! don’t bother if 404
    retry: false,
  });

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
          set_id: setId,
          key: snakeCase(trimmedValue),
          label: trimmedValue,
        },
      });

      toast({ description: "Trait value created.", variant: "success" });
      form.reset();
      qc.invalidateQueries({
        queryKey: traitSetValuesQueryOptions(setId).queryKey,
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
            search,
          });
          toast({
            variant: "success",
            description: `Trait set "${traitSet.label}" deleted successfully.`,
          });
        } catch (error) {
          toast({
            variant: "error",
            description: `Failed to delete trait set "${traitSet.label}".`,
          });
        }
      },
    });
  };

  if (osLoad || osvLoad) return <div>Loading...</div>;
  if (osErr || !traitSet) return <div>Trait set not found.</div>;
  return (
    <Box>
      <Heading size="6">Trait Set: {traitSet.label}</Heading>
      <IconButton
        size="1"
        color="tomato"
        onClick={() => handleTraitSetDeleteClick(traitSet)}
      >
        <PiTrash />
      </IconButton>
      <Text>{traitSet.description}</Text>
      <Separator mt="2" mb="2" />
      <Heading size="6">Values:</Heading>
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
      {!traitSetValues?.length || osvError ? (
        <div>No values found.</div>
      ) : (
        traitSetValues.map((val) => (
          <Box key={val.id}>
            <Text>
              {val.label}{" "}
              {val.isCanonical ? "" : ` (-> ${val.aliasTarget?.label})`}
            </Text>
          </Box>
        ))
      )}
    </Box>
  );
}
