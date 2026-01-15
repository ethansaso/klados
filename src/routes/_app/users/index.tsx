import { Box, Heading } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import { routeSeo } from "../../../lib/utils/head/routeSeo";

export const Route = createFileRoute("/_app/users/")({
  head: () =>
    routeSeo({
      title: "Users | Klados",
    }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Box>
      <Heading>Users</Heading>
      <Box mb="4">List of users will go here.</Box>
      <Heading>Curators</Heading>
      <Box mb="4">List of curators will go here.</Box>
    </Box>
  );
}
