import { Button } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import { PropsWithChildren } from "react";

interface ItemProps {
  to: string;
  active: boolean;
}

const Item = ({ to, children, active }: PropsWithChildren<ItemProps>) => {
  return (
    <li className={active ? "active" : ""}>
      <Button variant={active ? "solid" : "soft"} asChild>
        <Link to={to}>{children}</Link>
      </Button>
    </li>
  );
};

const Root = ({ children }: PropsWithChildren) => {
  return (
    <aside className="nav-sidebar">
      <ul>{children}</ul>
    </aside>
  );
};

const NavSidebar = {
  Root,
  Item,
};
export default NavSidebar;
