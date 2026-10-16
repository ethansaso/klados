import { Box, Card, Flex, Heading, Inset, Link, Text } from "@radix-ui/themes";
import { createFileRoute, Link as RouterLink } from "@tanstack/react-router";
import { ContentContainer } from "../../components/ContentContainer";
import { KoFiButton } from "../../components/KoFiButton";
import { routeSeo } from "../../lib/utils/head/routeSeo";

export const Route = createFileRoute("/_app/donate")({
  head: ({ match }) =>
    routeSeo({
      title: "Donate | Klados",
      canonicalUrl: match.pathname,
    }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ContentContainer align="stretch">
      <Box width="100%" maxWidth="560px" mx="auto" py={{ sm: "6" }}>
        <Card size={{ initial: "3", sm: "4" }}>
          <Inset side="top" pb="current">
            <img
              src={"/about/physarum.jpg"}
              alt={
                "A colony of Physarum, captured at Portola Redwoods State Park."
              }
              style={{
                display: "block",
                width: "100%",
                aspectRatio: "16 / 7",
                objectFit: "cover",
                objectPosition: "bottom",
              }}
            />
          </Inset>
          <Heading as="h1" size={{ initial: "7", sm: "8" }} mb="3">
            Support Klados
          </Heading>
          <Text as="p" mb="3">
            Klados is and always will be free. All costs are paid out of pocket:
            hosting, the database, image storage, and the domain.
          </Text>
          <Text as="p" mb="5">
            If Klados has helped you learn something, and you'd like to help
            keep it running, a small contribution goes a long way. Thank you!
          </Text>
          <Flex direction="column" align="center" gap="2">
            <KoFiButton />
            <Text as="p" size="1" color="gray">
              Opens Ko-fi in a new tab.
            </Text>
          </Flex>
        </Card>
        <Text as="p" align="center" mt="5">
          Not able to donate? You can also{" "}
          <Link asChild>
            <RouterLink to="/curators/new">become a curator</RouterLink>
          </Link>{" "}
          or{" "}
          <Link
            href="https://github.com/ethansaso/klados"
            target="_blank"
            rel="noopener noreferrer"
          >
            contribute on GitHub
          </Link>
          .
        </Text>
      </Box>
    </ContentContainer>
  );
}
