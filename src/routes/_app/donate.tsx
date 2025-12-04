import { Box, Flex, Heading, Strong, Text } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import { ContentContainer } from "../../components/ContentContainer";
import { KoFiWidget } from "../../components/KoFiWidget";

export const Route = createFileRoute("/_app/donate")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ContentContainer align="center" p="3">
      <Heading mb="6" size="8">
        Donate
      </Heading>
      <Flex gap="4" justify="center">
        <KoFiWidget />
        <Box maxWidth="400px">
          <Text as="p" mb="4" size="5">
            <Strong>
              Your support helps keep Klados online and improving!
            </Strong>
          </Text>
          <Text as="p" mb="4" size="5">
            While Klados is and will always be a free service, we pay out of
            pocket to keep it online.
          </Text>
          <Text as="p" mb="4" size="5">
            If you find Klados useful and would like to support its continued
            operation, please consider donating. Thank you!
          </Text>
        </Box>
      </Flex>
    </ContentContainer>
  );
}
