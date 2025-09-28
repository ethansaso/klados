import { Button, Flex, Text, TextField } from "@radix-ui/themes";
import { useState } from "react";
import { PiAt, PiUser } from "react-icons/pi";
import { authClient } from "../../lib/auth/authClient";
import { useNavigate } from "@tanstack/react-router";

export function SignUpForm() {
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();

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
    navigate({ to: "/" });
  }

  return (
    <form onSubmit={onSubmit}>
      <Flex direction="column" gap="3">
        <TextField.Root name="username" placeholder="Username" required>
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
          type="password"
          placeholder="Password"
          required
        />
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
