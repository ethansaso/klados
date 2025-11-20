import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  TextField,
} from "@radix-ui/themes";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Label } from "radix-ui";
import { SubmitHandler, useForm } from "react-hook-form";
import z from "zod";
import {
  a11yProps,
  ConditionalAlert,
} from "../../components/inputs/ConditionalAlert";
import { authClient } from "../../lib/auth/authClient";
import { meQuery } from "../../lib/queries/users";
import { getMe } from "../../lib/serverFns/users/user";
import { toast } from "../../lib/utils/toast";

function isEmail(s: string) {
  // simple heuristic; server remains the source of truth
  return /\S+@\S+\.\S+/.test(s);
}

const schema = z.object({
  identifier: z.string().min(1, "Enter your email or username."),
  password: z.string().min(1, "Enter your password."),
});
type FormFields = z.infer<typeof schema>;

// TODO: use loading state on signup/signin
export const Route = createFileRoute("/_app/login")({
  beforeLoad: async ({}) => {
    const user = await getMe();
    if (user) {
      throw redirect({ to: "/" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
  });

  const onSubmit: SubmitHandler<FormFields> = async ({
    identifier,
    password,
  }) => {
    const rememberMe = true;

    let res:
      | Awaited<ReturnType<typeof authClient.signIn.email>>
      | Awaited<ReturnType<typeof authClient.signIn.username>>;

    if (isEmail(identifier)) {
      res = await authClient.signIn.email({
        email: identifier,
        password,
        rememberMe,
      });
    } else {
      res = await authClient.signIn.username({
        username: identifier,
        password,
        rememberMe,
      });
    }

    if (res.error) {
      toast({
        variant: "error",
        description: "Invalid username or password",
      });
      return;
    }

    await queryClient.invalidateQueries({ queryKey: meQuery().queryKey });
    await queryClient.refetchQueries({ queryKey: meQuery().queryKey });

    navigate({ to: "/" });
  };

  return (
    <Container size="3">
      <Flex justify="center" mt="6">
        <Box style={{ width: 400 }}>
          <Card size="3">
            <Box mb="2">
              <Heading size="6" mb="4">
                Sign in
              </Heading>
            </Box>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Box mb="4">
                <Flex justify="between" align="baseline" mb="1">
                  <Label.Root htmlFor="identifier">
                    Username or email
                  </Label.Root>
                  <ConditionalAlert
                    id="identifier-error"
                    message={errors.identifier?.message}
                  />
                </Flex>
                <TextField.Root
                  id="identifier"
                  {...register("identifier")}
                  {...a11yProps("identifier-error", !!errors.identifier)}
                  type="text"
                  autoComplete="username"
                />
              </Box>

              <Box mb="6">
                <Flex justify="between" align="baseline" mb="1">
                  <Label.Root htmlFor="password">Password</Label.Root>
                  <ConditionalAlert
                    id="password-error"
                    message={errors.password?.message}
                  />
                </Flex>
                <TextField.Root
                  id="password"
                  {...register("password")}
                  {...a11yProps("password-error", !!errors.password)}
                  type="password"
                  autoComplete="current-password"
                />
              </Box>
              <Flex gap="2" justify="end">
                <Button
                  type="button"
                  variant="soft"
                  onClick={() => navigate({ to: "/signup" })}
                >
                  Create an account
                </Button>
                <Button type="submit">Sign in</Button>
              </Flex>
            </form>
          </Card>
        </Box>
      </Flex>
    </Container>
  );
}
