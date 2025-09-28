import { createFileRoute } from "@tanstack/react-router";
import { SignInForm } from "../../components/auth/SignInForm";
import { Card, Container, Flex, Box, Text } from "@radix-ui/themes";

export const Route = createFileRoute("/_app/login")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Container size="3">
      <Flex justify="center" mt="6">
        <Box style={{ width: 400 }}>
          <Card>
            <Box mb="2">
              <Text>Sign in to your account.</Text>
            </Box>
            <SignInForm />
          </Card>
        </Box>
      </Flex>
    </Container>
  );
}
