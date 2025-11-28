import { Box, Flex } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import { KeyRenderer } from "./-react-flow/FlowRenderer";

export const Route = createFileRoute("/_app/keys/create/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Flex>
      <Box>Sidebar</Box>
      <KeyRenderer />
    </Flex>
  );
}
