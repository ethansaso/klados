import { Badge } from "@radix-ui/themes";
import type { ComponentProps } from "react";
import type { UserDTO } from "../lib/domain/users/types";
import { capitalizeFirstLetter } from "../lib/utils/formatting/casing";

interface UserBadgeProps extends ComponentProps<typeof Badge> {
  role: UserDTO["role"];
}

export const RoleBadge = ({ role, size = "1", ...rest }: UserBadgeProps) => {
  if (role === "user") return null;
  return (
    <Badge
      variant="soft"
      size={size}
      color={role === "admin" ? "tomato" : undefined}
      {...rest}
    >
      {capitalizeFirstLetter(role)}
    </Badge>
  );
};
