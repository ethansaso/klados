import {
  Box,
  Flex,
  Heading,
  IconButton,
  Separator,
  Text,
  TextField,
} from "@radix-ui/themes";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PiPlusCircle } from "react-icons/pi";
import z from "zod";
import {
  optionSetQueryOptions,
  optionSetValuesQueryOptions,
} from "../../../../../lib/queries/options";
import { createOptionValue } from "../../../../../lib/serverFns/characters/options/fns";
import { snakeCase } from "../../../../../lib/utils/casing";
import { toast } from "../../../../../lib/utils/toast";

const ParamsSchema = z.object({
  setId: z.coerce.number().int().positive(),
});

export const Route = createFileRoute("/_app/characters/options/$setId/")({
  loader: async ({ context, params }) => {
    const { setId } = ParamsSchema.parse(params);

    // Warm the cache for both resources
    await context.queryClient.ensureQueryData(optionSetQueryOptions(setId));
    await context.queryClient.ensureQueryData(
      optionSetValuesQueryOptions(setId)
    );
  },
  component: RouteComponent,
});

// TODO: alias, keys, editing, deleting values
function RouteComponent() {
  const { setId } = ParamsSchema.parse(Route.useParams());
  const serverCreate = useServerFn(createOptionValue);
  const qc = useQueryClient();

  const { data: optionSet } = useSuspenseQuery(optionSetQueryOptions(setId));
  const { data: optionSetValues } = useSuspenseQuery(
    optionSetValuesQueryOptions(setId)
  );

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

  // Data is available here as `optionSet` and `optionSetValues`
  return (
    <Box>
      <Heading size="6">Option Set: {optionSet.label}</Heading>
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
      {optionSetValues.map((val) => (
        <Box key={val.id}>
          <Text>
            {val.label}{" "}
            {val.isCanonical ? "" : ` (-> ${val.aliasTarget?.label})`}
          </Text>
        </Box>
      ))}
    </Box>
  );
}
