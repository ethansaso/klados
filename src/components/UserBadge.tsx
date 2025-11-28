import { Badge } from "@radix-ui/themes";
import { ComponentProps } from "react";
import { UserDTO } from "../lib/domain/users/types";
import { capitalizeWord } from "../lib/utils/casing";

interface UserBadgeProps extends ComponentProps<typeof Badge> {
  role: UserDTO["role"];
}

export const UserBadge = ({ role, ...rest }: UserBadgeProps) => {
  if (role === "user") return null;
  return (
    <Badge
      variant="soft"
      color={role === "admin" ? "tomato" : undefined}
      {...rest}
    >
      {capitalizeWord(role)}
    </Badge>
  );
};
