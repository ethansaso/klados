import { Flex } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import { KeyEditorCanvas } from "../../../../components/react-flow-keys/KeyEditorCanvas";
import { KeySidebar } from "./-KeySidebar";

export const Route = createFileRoute("/_app/keys/create/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Flex className="key-creator">
      <KeySidebar />
      <KeyEditorCanvas />
    </Flex>
  );
}
