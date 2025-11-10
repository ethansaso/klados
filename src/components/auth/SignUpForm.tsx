import { Button, Flex, IconButton, Text, TextField } from "@radix-ui/themes";
import { useState } from "react";
import {
  PiAt,
  PiEye,
  PiEyeSlash,
  PiEyesLight,
  PiLock,
  PiUser,
} from "react-icons/pi";
import { authClient } from "../../lib/auth/authClient";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { meQuery } from "../../lib/queries/users";

export function SignUpForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [err, setErr] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);

    const fd = new FormData(e.currentTarget);
    const username = String(fd.get("username") || "");
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");

    const { error } = await authClient.signUp.email({
      email,
      name: username,
      password,
      username,
    });

    if (error) {
      setErr(error.message ?? "Sign up failed. Please try again later.");
      return;
    }

    await queryClient.invalidateQueries({ queryKey: meQuery().queryKey });
    await queryClient.refetchQueries({ queryKey: meQuery().queryKey });
    navigate({ to: "/" });
  }

  return (
    <form onSubmit={onSubmit}>
      <Flex direction="column" gap="3">
        <TextField.Root
          name="username"
          type="text"
          placeholder="Username"
          required
        >
          <TextField.Slot>
            <PiUser />
          </TextField.Slot>
        </TextField.Root>
        <TextField.Root name="email" type="email" placeholder="Email" required>
          <TextField.Slot>
            <PiAt />
          </TextField.Slot>
        </TextField.Root>
        <TextField.Root
          name="password"
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          required
        >
          <TextField.Slot>
            <PiLock />
          </TextField.Slot>
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
        {err ? (
          <Text color="red" size="2">
            {err}
          </Text>
        ) : null}
        <Button type="submit">Create account</Button>
      </Flex>
    </form>
  );
}
