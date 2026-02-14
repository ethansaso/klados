import { Box, Heading, Link as RadixLink, Text } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import z from "zod";
import { featureQueryOptions } from "../../../../lib/queries/features";

const ParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const Route = createFileRoute("/_app/glossary/features/$id")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex,follow" }],
  }),
  params: ParamsSchema,
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(featureQueryOptions(params.id));
    return params;
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useLoaderData();

  const { data: feature } = useSuspenseQuery(featureQueryOptions(id));

  return (
    <Box>
      <Heading size="6">Feature: {feature.label}</Heading>
      <Text>{feature.description}</Text>
      {feature.parentFeature && (
        <RadixLink size="2" asChild>
          <Link
            to="/glossary/features/$id"
            params={{ id: feature.parentFeature.id }}
          >
            Parent feature: {feature.parentFeature.label}
          </Link>
        </RadixLink>
      )}
      {feature.subFeatures.length > 0 && (
        <Box mt="4">
          <Heading size="5">Sub-features</Heading>
          {feature.subFeatures.map((sub) => (
            <Box key={sub.id} mb="2">
              <RadixLink asChild>
                <Link to="/glossary/features/$id" params={{ id: sub.id }}>
                  {sub.label}
                </Link>
              </RadixLink>
            </Box>
          ))}
        </Box>
      )}
      <Box>
        {feature.characters.map((char) => (
          <Box key={char.id} mb="2">
            <RadixLink asChild>
              <Link to="/glossary/characters/$id" params={{ id: char.id }}>
                {char.label}
              </Link>
            </RadixLink>
            <Text as="div">{char.description}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
