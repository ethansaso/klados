import { createFileRoute } from "@tanstack/react-router";
import { SignUpForm } from '../../components/auth/SignUpForm'
import { Card, Container, Flex, Box, Text } from "@radix-ui/themes";

export const Route = createFileRoute("/_app/signup")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Container size="3">
      <Flex justify="center" mt="6">
        <Box style={{ width: 400 }}>
          <Card>
            <Box mb="2">
              <Text>Sign up for a free account.</Text>
            </Box>
            <SignUpForm />
          </Card>
        </Box>
      </Flex>
    </Container>
  );
}
