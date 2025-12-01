import { useSuspenseQuery } from "@tanstack/react-query";
import { meQuery } from "../queries/users";

export function useMe() {
  return useSuspenseQuery(meQuery());
}
