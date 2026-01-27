import { Badge } from "@radix-ui/themes";
import type { ComponentProps } from "react";
import type { UserDTO } from "../lib/domain/users/types";
import { capitalizeFirstLetter } from "../lib/utils/formatting/casing";

interface UserBadgeProps extends ComponentProps<typeof Badge> {
  role: UserDTO["role"];
  banned: UserDTO["banned"];
}

export const RoleBadge = ({
  role,
  banned,
  size = "1",
  ...rest
}: UserBadgeProps) => {
  if (role === "user" && !banned) return null;
  return (
    <Badge
      variant={banned ? "solid" : "soft"}
      size={size}
      color={role === "admin" ? "tomato" : banned ? "tomato" : undefined}
      {...rest}
    >
      {banned ? "BANNED" : capitalizeFirstLetter(role)}
    </Badge>
  );
};
