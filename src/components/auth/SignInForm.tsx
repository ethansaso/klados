import { Button, Flex, Text, TextField } from "@radix-ui/themes";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PiAt, PiLock } from "react-icons/pi";
import { authClient } from "../../lib/auth/authClient";
import { meQuery } from "../../lib/queries/users";

function isEmail(s: string) {
  // simple heuristic; server remains the source of truth
  return /\S+@\S+\.\S+/.test(s);
}

export function SignInForm() {
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);

    const fd = new FormData(e.currentTarget);
    const identifier = String(fd.get("identifier") || "").trim();
    const password = String(fd.get("password") || "");
    const rememberMe = true; // persistent cookie

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
      setErr(res.error.message ?? "Sign in failed");
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
          name="identifier"
          type="text"
          placeholder="Email or username"
          autoComplete="username"
          required
        >
          <TextField.Slot>
            <PiAt />
          </TextField.Slot>
        </TextField.Root>
        <TextField.Root
          name="password"
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          required
        >
          <TextField.Slot>
            <PiLock />
          </TextField.Slot>
        </TextField.Root>
        {err ? <Text color="red">{err}</Text> : null}
        <Button type="submit">Sign in</Button>
      </Flex>
    </form>
  );
}
