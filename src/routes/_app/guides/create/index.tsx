import { Box, Flex } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import { ReactFlowProvider } from "@xyflow/react";
import z from "zod";
import { GuideEditorCanvas } from "../../../../components/react-flow-guides/GuideEditorCanvas";
import { routeSeo } from "../../../../lib/utils/head/routeSeo";
import { GuideEditorSidebar } from "./-GuideEditorSidebar";
import { GuideEditorToolbar } from "./-GuideEditorToolbar";

import guideEditorCssUrl from "../../../../assets/styles/pages/guides/editor.css?url";

// Simple schema for initial population of taxon selection
const CreateGuideSearchSchema = z.object({
  initialId: z.coerce.number().int().positive().optional(),
});

export const Route = createFileRoute("/_app/guides/create/")({
  head: () =>
    routeSeo({
      title: "Create Guide | Klados",
      links: [{ rel: "stylesheet", href: guideEditorCssUrl }],
    }),
  validateSearch: CreateGuideSearchSchema,
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Box className="guide-editor">
      <ReactFlowProvider>
        <Flex className="guide-editor-overlay" p="4" direction="column" gap="4">
          <GuideEditorSidebar />
          <GuideEditorToolbar />
        </Flex>
        <GuideEditorCanvas />
      </ReactFlowProvider>
    </Box>
  );
}
