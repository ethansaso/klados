import "./new.css";

import { Box, Button, Flex, Heading, Link, Text } from "@radix-ui/themes";
import { createFileRoute, Link as RouterLink } from "@tanstack/react-router";
import type { PropsWithChildren } from "react";
import { PiArrowRight } from "react-icons/pi";
import { ContentContainer } from "../../../components/ContentContainer";
import { routeSeo } from "../../../lib/utils/head/routeSeo";

const EMAIL = "admin@klados.bio";
const APPLY_HREF = `mailto:${EMAIL}?subject=${encodeURIComponent("Curator application")}`;

export const Route = createFileRoute("/_app/curators/new")({
  head: ({ match }) =>
    routeSeo({
      title: "Become a curator | Klados",
      canonicalUrl: match.pathname,
    }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ContentContainer align="stretch">
      <Box width="100%" maxWidth="600px" mx="auto" py={{ sm: "6" }}>
        <Heading as="h1" size={{ initial: "7", sm: "8" }} mb="5">
          Become a curator
        </Heading>
        <Text as="p" size="4">
          Curators are the people who make Klados possible through their
          authorship. If you have expertise, please reach out! No coding or
          formal credentials needed.{" "}
          <Text weight="bold">
            Note: Klados is only focusing on fungi for now.
          </Text>
        </Text>

        <Heading as="h2" size="5" color="amber" highContrast mt="6" mb="4">
          How to apply
        </Heading>
        <Flex asChild direction="column" gap="4">
          <ol className="curator-steps">
            <Step title="Create an account">
              If you don't have one yet,{" "}
              <Link asChild color="amber">
                <RouterLink to="/signup">sign up</RouterLink>
              </Link>
              .
            </Step>
            <Step title="Send a short email">
              Write to{" "}
              <Link color="amber" href={APPLY_HREF}>
                {EMAIL}
              </Link>{" "}
              with your username, the groups you know, and a little about your
              background.
            </Step>
            <Step title="Hear back">
              You'll receive a reply in a few days detailing curator access for
              your account.
            </Step>
          </ol>
        </Flex>

        <Box asChild width={{ initial: "100%", xs: "auto" }} mt="6">
          <Button asChild size="3" radius="full">
            <a href={APPLY_HREF}>
              Email to apply
              <PiArrowRight />
            </a>
          </Button>
        </Box>
      </Box>
    </ContentContainer>
  );
}

function Step({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <Flex asChild gap="3">
      <li>
        {/* Numbered by a CSS counter on the list */}
        <Flex
          className="curator-steps__number"
          align="center"
          justify="center"
          flexShrink="0"
          aria-hidden
        />
        <Box>
          <Text as="p" weight="medium">
            {title}
          </Text>
          <Text as="p" color="gray" highContrast>
            {children}
          </Text>
        </Box>
      </li>
    </Flex>
  );
}
