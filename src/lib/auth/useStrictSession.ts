import { useSession } from "./authClient";

export function useStrictSession(): ReturnType<typeof useSession> & { data: { user: { username: string } } | null } {
  const { data, ...rest } = useSession();
  const ok = !!data?.user?.username?.trim();
  return { data: ok ? (data as typeof data & { user: { username: string } }) : null, ...rest };
}