import {
  Box,
  Card,
  Container,
  Flex,
  Heading,
  Link,
  Text,
} from "@radix-ui/themes";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { routeSeo } from "../../lib/utils/head/routeSeo";

export const Route = createFileRoute("/_app/verify-email")({
  head: () =>
    routeSeo({
      title: "Verify Your Email | Klados",
    }),
  beforeLoad: async ({ context }) => {
    const user = context.user;
    if (user) {
      throw redirect({ to: "/" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Container size="3">
      <Flex justify="center" mt="6">
        <Box style={{ width: 400 }}>
          <Card size="3">
            <Heading mb="4">Verify your email address</Heading>
            <Text as="p" mb="2">
              Please check your email for a link to verify your account.
            </Text>
            <Text as="p">
              If you did not receive the email, please check your spam folder or
              contact <Link href="mailto:help@klados.bio">help@klados.bio</Link>
              .
            </Text>
          </Card>
        </Box>
      </Flex>
    </Container>
  );
}
