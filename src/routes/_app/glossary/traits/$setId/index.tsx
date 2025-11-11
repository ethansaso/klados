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
import { useState } from "react";
import { PiPlusCircle, PiTrash } from "react-icons/pi";
import z from "zod";
import {
  traitSetQueryOptions,
  traitSetValuesQueryOptions,
} from "../../../../../lib/queries/traits";
import {
  createTraitValue,
  deleteTraitSet,
} from "../../../../../lib/serverFns/traits/fns";
import { TraitSetDTO } from "../../../../../lib/serverFns/traits/types";
import { snakeCase } from "../../../../../lib/utils/casing";
import { toast } from "../../../../../lib/utils/toast";
import { Route as TraitsLayoutRoute } from "../route";
import { ConfirmTraitSetDeleteModal } from "./-ConfirmTraitSetDeleteModal";

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
  const navigate = useNavigate();
  const qc = useQueryClient();
  const serverDelete = useServerFn(deleteTraitSet);

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

  const [newValue, setNewValue] = useState<string>("");

  const handleAddValue = async () => {
    const trimmedValue = newValue.trim();
    if (!trimmedValue) return;

    try {
      await serverCreate({
        data: {
          setId,
          key: snakeCase(trimmedValue),
          label: trimmedValue,
        },
      });

      toast({ description: "Trait value created.", variant: "success" });
      qc.invalidateQueries({
        queryKey: traitSetValuesQueryOptions(setId).queryKey,
      });
      setNewValue("");
    } catch (error) {
      console.error("Error creating trait value:", error);
    }
  };

  const handleTraitSetDeleteClick = (traitSet: TraitSetDTO) => {
    NiceModal.show(ConfirmTraitSetDeleteModal, {
      label: traitSet.label,
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
      <Flex mb="2">
        <TextField.Root
          id="new-value"
          placeholder="Add a new value..."
          value={newValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setNewValue(e.target.value)
          }
        />
        <IconButton type="button" onClick={handleAddValue}>
          <PiPlusCircle />
        </IconButton>
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
