import { Box } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import { ReactFlowProvider } from "@xyflow/react";
import z from "zod";
import { KeyEditorCanvas } from "../../../../components/react-flow-keys/KeyEditorCanvas";
import { KeySidebar } from "./-KeySidebar";
import { KeyToolbar } from "./-KeyToolbar";

// Simple schema for initial population of taxon selection
const CreateKeySearchSchema = z.object({
  initialId: z.coerce.number().int().positive().optional(),
});

export const Route = createFileRoute("/_app/keys/create/")({
  validateSearch: CreateKeySearchSchema,
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Box className="key-creator">
      <ReactFlowProvider>
        <Box className="key-creator-overlay">
          <KeySidebar />
          <KeyToolbar />
        </Box>
        <KeyEditorCanvas />
      </ReactFlowProvider>
    </Box>
  );
}
