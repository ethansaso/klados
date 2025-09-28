import { useState } from "react";
import { Button, TextField, Flex, Text } from "@radix-ui/themes";
import { authClient } from "../../lib/auth/authClient";
import { Form } from "radix-ui";
import { useNavigate } from "@tanstack/react-router";

export function SignInForm() {
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");
    const rememberMe = true; // persistent cookie
    const { error } = await authClient.signIn.email({ email, password, rememberMe });
    if (error) setErr(error.message ?? "Sign in failed");
    navigate({ to: "/" });
  }

  return (
    <form onSubmit={onSubmit}>
      <Flex direction="column" gap="3">
        <TextField.Root name="email" type="email" placeholder="Email" required />
        <TextField.Root name="password" type="password" placeholder="Password" required />
        {err ? <Text color="red">{err}</Text> : null}
        <Button type="submit">Sign in</Button>
      </Flex>
    </form>
  );
}
