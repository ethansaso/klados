import { Box } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import { ReactFlowProvider } from "@xyflow/react";
import { KeyEditorCanvas } from "../../../../components/react-flow-keys/KeyEditorCanvas";
import { KeySidebar } from "./-KeySidebar";
import { KeyToolbar } from "./-KeyToolbar";

export const Route = createFileRoute("/_app/keys/create/")({
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
