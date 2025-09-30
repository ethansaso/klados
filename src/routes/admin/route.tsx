import { Button, Flex, Heading } from "@radix-ui/themes";
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { useIsActive } from "../../lib/hooks/useIsActive";
import { getMe } from "../../lib/serverFns/user";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    const user = await getMe();
    if (!user || user.role !== "admin") {
      throw redirect({ to: "/" });
    }
    return {
      user,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const homeActive = useIsActive("/admin");
  const usersActive = useIsActive("/admin/users");

  return (
    <div className="admin__container">
      <Flex align="center" justify="between" py="3" px="4" asChild>
        <header className="admin__header">
          <Heading>TaxoKeys Admin Panel</Heading>
          <Flex asChild gap="4">
            <nav>
              <Link to="/">Visit Site</Link>
              <Link to="/logout">Log Out</Link>
            </nav>
          </Flex>
        </header>
      </Flex>
      <Flex flexGrow="1">
        <aside className="admin__sidebar">
          <ul>
            <li className={homeActive ? "active" : ""}>
              <Button variant={homeActive ? "solid" : "soft"} asChild>
                <Link to="/admin">Home</Link>
              </Button>
            </li>
            <li className={usersActive ? "active" : ""}>
              <Button variant={usersActive ? "solid" : "soft"} asChild>
                <Link to="/admin/users">Users</Link>
              </Button>
            </li>
          </ul>
        </aside>
        <Outlet />
      </Flex>
    </div>
  );
}
