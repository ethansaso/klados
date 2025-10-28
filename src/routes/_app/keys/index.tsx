import { Box, Button, Flex, TextField } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PiMagnifyingGlass } from "react-icons/pi";

export const Route = createFileRoute("/_app/keys/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const [localInput, setLocalInput] = useState<string>("");

  return (
    <Flex direction="column">
      <Box mb="4">
        <Button onClick={() => navigate({ to: "create" })}>
          Create New Key
        </Button>
      </Box>
      <Box mb="4">
        <TextField.Root
          placeholder="Search keys..."
          id="taxa-search"
          value={localInput}
          onChange={(e) => setLocalInput(e.currentTarget.value)}
        >
          <TextField.Slot>
            <PiMagnifyingGlass size="16" />
          </TextField.Slot>
        </TextField.Root>
      </Box>
      Foo
    </Flex>
  );
}
