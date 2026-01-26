import { Heading } from "@radix-ui/themes";
import classNames from "classnames";
import type { ComponentPropsWithoutRef } from "react";

type AdminSectionHeaderProps = ComponentPropsWithoutRef<typeof Heading>;

export const AdminSectionHeader = ({
  children,
  className,
  ...props
}: AdminSectionHeaderProps) => {
  return (
    <Heading
      {...props}
      className={classNames("admin__section-header", className)}
    >
      {children}
    </Heading>
  );
};
