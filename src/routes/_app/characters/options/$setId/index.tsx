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
  optionSetQueryOptions,
  optionSetValuesQueryOptions,
} from "../../../../../lib/queries/options";
import {
  createOptionValue,
  deleteOptionSet,
} from "../../../../../lib/serverFns/characters/options/fns";
import { OptionSetDTO } from "../../../../../lib/serverFns/characters/options/types";
import { snakeCase } from "../../../../../lib/utils/casing";
import { toast } from "../../../../../lib/utils/toast";
import { Route as OptionsLayoutRoute } from "../route";
import { ConfirmOptionSetDeleteModal } from "./-ConfirmOptionSetDeleteModal";

const ParamsSchema = z.object({
  setId: z.coerce.number().int().positive(),
});

export const Route = createFileRoute("/_app/characters/options/$setId/")({
  loader: async ({ context, params }) => {
    const { setId } = ParamsSchema.parse(params);
    return { setId };
  },
  component: RouteComponent,
});

// TODO: alias, keys, editing, deleting values
// TODO: handle 404s
function RouteComponent() {
  const search = OptionsLayoutRoute.useSearch();
  const { setId } = Route.useLoaderData();
  const serverCreate = useServerFn(createOptionValue);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const serverDelete = useServerFn(deleteOptionSet);

  const {
    data: optionSet,
    error: osErr,
    isLoading: osLoad,
  } = useQuery({
    ...optionSetQueryOptions(setId),
    retry: false,
  });

  const {
    data: optionSetValues,
    isLoading: osvLoad,
    error: osvError,
  } = useQuery({
    ...optionSetValuesQueryOptions(setId),
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

      toast({ description: "Option value created.", variant: "success" });
      qc.invalidateQueries({
        queryKey: optionSetValuesQueryOptions(setId).queryKey,
      });
      setNewValue("");
    } catch (error) {
      console.error("Error creating option value:", error);
    }
  };

  const handleOptionSetDeleteClick = (optionSet: OptionSetDTO) => {
    NiceModal.show(ConfirmOptionSetDeleteModal, {
      label: optionSet.label,
      onConfirm: async () => {
        try {
          await serverDelete({ data: { id: optionSet.id } });
          qc.invalidateQueries({ queryKey: ["optionSets"] });
          qc.invalidateQueries({
            queryKey: optionSetQueryOptions(optionSet.id).queryKey,
          });
          qc.invalidateQueries({
            queryKey: optionSetValuesQueryOptions(optionSet.id).queryKey,
          });
          navigate({
            to: "/characters/options",
            search,
          });
          toast({
            variant: "success",
            description: `Option set "${optionSet.label}" deleted successfully.`,
          });
        } catch (error) {
          toast({
            variant: "error",
            description: `Failed to delete option set "${optionSet.label}".`,
          });
        }
      },
    });
  };

  // Data is available here as `optionSet` and `optionSetValues`
  if (osLoad || osvLoad) return <div>Loading...</div>;
  if (osErr || !optionSet) return <div>Option set not found.</div>;
  return (
    <Box>
      <Heading size="6">Option Set: {optionSet.label}</Heading>
      <IconButton
        size="1"
        color="tomato"
        onClick={() => handleOptionSetDeleteClick(optionSet)}
      >
        <PiTrash />
      </IconButton>
      <Text>{optionSet.description}</Text>
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
      {!optionSetValues?.length || osvError ? (
        <div>No values found.</div>
      ) : (
        optionSetValues.map((val) => (
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
