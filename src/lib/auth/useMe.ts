import { useSuspenseQuery } from "@tanstack/react-query";
import { meQueryOptions } from "../queries/users";

export function useMe() {
  return useSuspenseQuery(meQueryOptions());
}
