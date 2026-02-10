import "../../../../assets/styles/pages/guides/viewer.css";

import { Box, Flex, Heading, Separator, Text } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ReactFlowProvider } from "@xyflow/react";
import z from "zod";
import { GuideViewerCanvas } from "../../../../components/react-flow-guides/GuideViewerCanvas";
import { guideQueryOptions } from "../../../../lib/queries/guides";
import { routeSeo } from "../../../../lib/utils/head/routeSeo";

const ParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const Route = createFileRoute("/_app/guides/$id/")({
  params: ParamsSchema,
  loader: async ({ context, params }) => {
    const { id } = params;

    const guide = await context.queryClient.ensureQueryData(
      guideQueryOptions(id),
    );

    return { id, guide };
  },
  head: ({ loaderData }) =>
    routeSeo({
      title: loaderData
        ? `Guide '${loaderData.guide.name}' | Klados`
        : "Klados",
    }),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useLoaderData();
  const { data: guide } = useSuspenseQuery(guideQueryOptions(id));

  return (
    <Flex direction="column" flexGrow="1">
      <Box>
        <Flex p="2" direction="column" align="center">
          <Heading size="5">{guide.name}</Heading>
          {guide.description && (
            <Text as="p" color="gray" size="2" mt="2">
              {guide.description}
            </Text>
          )}
        </Flex>
        <Separator orientation="horizontal" size="4" />
      </Box>
      <Box className="guide-viewer">
        <ReactFlowProvider>
          <GuideViewerCanvas graph={guide.rootNode} />
        </ReactFlowProvider>
      </Box>
    </Flex>
  );
}
