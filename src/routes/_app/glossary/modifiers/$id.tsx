import { Box, Heading, Text } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { modifierGroupQueryOptions } from "../../../../lib/queries/modifiers";

export const Route = createFileRoute("/_app/glossary/modifiers/$id")({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  loader: async ({ context, params }) => {
    const { id } = params;
    await context.queryClient.ensureQueryData(modifierGroupQueryOptions(id));
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const { data: modifierGroup } = useSuspenseQuery(
    modifierGroupQueryOptions(id),
  );

  return (
    <Box>
      <Heading>{modifierGroup.label}</Heading>
      <Text color={modifierGroup.description ? undefined : "gray"}>
        {modifierGroup.description || "No description."}
      </Text>
      <Box>
        {modifierGroup.values.length ? (
          modifierGroup.values.map((mod) => (
            <Box key={mod.id} mb="2">
              <Text as="div" weight="medium">
                {mod.value} ({mod.affixType})
              </Text>
              <Text as="div" color={mod.description ? undefined : "gray"}>
                {mod.description || "No description."}
              </Text>
            </Box>
          ))
        ) : (
          <Text color="gray">This modifier has no values.</Text>
        )}
      </Box>
    </Box>
  );
}
