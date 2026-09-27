import { Heading, Text } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import { ContentContainer } from "../../../components/ContentContainer";

export const Route = createFileRoute("/_app/curators/new")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ContentContainer align="start">
      <Heading>This page is a work in progress.</Heading>
      <Text mt="2">
        If you'd like to become a curator, please reach out to Ethan directly
        with your username and your background.
      </Text>
      <Text mt="1">Thank you!</Text>
    </ContentContainer>
  );
}
