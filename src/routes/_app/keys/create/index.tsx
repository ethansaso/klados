import { Flex } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import { KeySidebar } from "./-KeySidebar";
import { KeyRenderer } from "./-react-flow/FlowRenderer";

export const Route = createFileRoute("/_app/keys/create/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Flex className="key-creator">
      <KeySidebar />
      <KeyRenderer />
    </Flex>
  );
}
