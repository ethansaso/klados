import { Heading } from "@radix-ui/themes";
import { ComponentPropsWithoutRef } from "react";
import classNames from "classnames";

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
