import { useState } from "react";
import { Button, TextField, Flex, Text } from "@radix-ui/themes";
import { authClient } from "../../lib/authClient";
import { Form } from "radix-ui";

export function SignInForm() {
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");
    const rememberMe = true; // persistent cookie
    const { error } = await authClient.signIn.email({ email, password, rememberMe });
    if (error) setErr(error.message ?? "Sign in failed");
    // success: session cookie is set; route change is up to you
  }

  return (
    <Form.Root onSubmit={onSubmit}>
      <Flex direction="column" gap="3">
        <TextField.Root name="email" type="email" placeholder="Email" required />
        <TextField.Root name="password" type="password" placeholder="Password" required />
        {err ? <Text color="red">{err}</Text> : null}
        <Button type="submit">Sign in</Button>
      </Flex>
    </Form.Root>
  );
}
