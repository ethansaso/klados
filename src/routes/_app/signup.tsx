import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  IconButton,
  Text,
  TextField,
} from "@radix-ui/themes";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Label } from "radix-ui";
import { useState } from "react";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import { PiCheck, PiEye, PiEyeSlash, PiX } from "react-icons/pi";
import z from "zod";
import {
  a11yProps,
  ConditionalAlert,
} from "../../components/inputs/ConditionalAlert";
import { getMeFn } from "../../lib/api/users/getMe";
import { authClient } from "../../lib/auth/authClient";
import {
  emailSchema,
  passwordSchema,
  usernameSchema,
} from "../../lib/auth/validation";
import { meQueryOptions } from "../../lib/queries/users";
import { toast } from "../../lib/utils/toast";

const schema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});
type FormFields = z.infer<typeof schema>;

export const Route = createFileRoute("/_app/signup")({
  beforeLoad: async () => {
    const user = await getMeFn();
    if (user) {
      throw redirect({ to: "/" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
  });

  const password = useWatch({ control, name: "password", defaultValue: "" });
  const pwChecks = {
    length: password.length >= 8 && password.length <= 128,
    mixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
    digit: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    const { username, email, password } = data;

    const { error } = await authClient.signUp.email({
      email,
      name: username,
      password,
      username,
    });

    if (error) {
      toast({
        description: error.message ?? "Sign up failed. Please try again later.",
        variant: "error",
      });
      return;
    }

    await queryClient.invalidateQueries({
      queryKey: meQueryOptions().queryKey,
    });
    await queryClient.refetchQueries({ queryKey: meQueryOptions().queryKey });
    navigate({ to: "/" });
  };

  return (
    <Container size="3">
      <Flex justify="center" mt="6">
        <Box style={{ width: 400 }}>
          <Card size="3">
            <Box mb="2">
              <Heading size="6" mb="4">
                Create your account
              </Heading>
            </Box>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Box mb="4">
                <Flex justify="between" align="baseline" mb="1">
                  <Label.Root htmlFor="username">Username</Label.Root>
                  <ConditionalAlert
                    id="username-error"
                    message={errors.username?.message}
                  />
                </Flex>
                <TextField.Root
                  autoFocus
                  id="username"
                  {...register("username")}
                  {...a11yProps("username-error", !!errors.username)}
                  type="text"
                />
              </Box>
              <Box mb="4">
                <Flex justify="between" align="baseline" mb="1">
                  <Label.Root htmlFor="email">Email address</Label.Root>
                  <ConditionalAlert
                    id="email-error"
                    message={errors.email?.message}
                  />
                </Flex>
                <TextField.Root
                  id="email"
                  {...register("email")}
                  {...a11yProps("email-error", !!errors.email)}
                  type="email"
                ></TextField.Root>
              </Box>
              <Box mb="4">
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
                  type={showPassword ? "text" : "password"}
                  autoComplete="false"
                >
                  <TextField.Slot side="right">
                    <IconButton
                      variant="ghost"
                      type="button"
                      size="1"
                      onClick={() => setShowPassword((p) => !p)}
                    >
                      {showPassword ? <PiEyeSlash /> : <PiEye />}
                    </IconButton>
                  </TextField.Slot>
                </TextField.Root>
              </Box>

              <Flex mb="4" gap="2" direction="column">
                <Flex justify="between" gap="2">
                  <Flex align="center" gap="1" flexBasis="50%">
                    {pwChecks.length ? (
                      <PiCheck aria-hidden color="var(--grass-9)" />
                    ) : (
                      <PiX aria-hidden color="var(--tomato-9)" />
                    )}
                    <Text size="2">8-128 characters</Text>
                  </Flex>
                  <Flex align="center" gap="1" flexBasis="50%">
                    {pwChecks.mixedCase ? (
                      <PiCheck aria-hidden color="var(--grass-9)" />
                    ) : (
                      <PiX aria-hidden color="var(--tomato-9)" />
                    )}
                    <Text size="2">Mixed case</Text>
                  </Flex>
                </Flex>
                <Flex justify="between" gap="2">
                  <Flex align="center" gap="1" flexBasis="50%">
                    {pwChecks.digit ? (
                      <PiCheck aria-hidden color="var(--grass-9)" />
                    ) : (
                      <PiX aria-hidden color="var(--tomato-9)" />
                    )}
                    <Text size="2">At least 1 number</Text>
                  </Flex>
                  <Flex align="center" gap="1" flexBasis="50%">
                    {pwChecks.special ? (
                      <PiCheck aria-hidden color="var(--grass-9)" />
                    ) : (
                      <PiX aria-hidden color="var(--tomato-9)" />
                    )}
                    <Text size="2">At least 1 symbol</Text>
                  </Flex>
                </Flex>
              </Flex>

              <Flex justify="end" mt="2">
                <Button type="submit">Create account</Button>
              </Flex>
            </form>
          </Card>
        </Box>
      </Flex>
    </Container>
  );
}
