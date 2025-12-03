import { Flex, Heading } from "@radix-ui/themes";
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import NavSidebar from "../../components/nav/NavSidebar";
import { getMeFn } from "../../lib/api/users/getMe";
import { useIsActive } from "../../lib/hooks/useIsActive";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    const user = await getMeFn();
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
          <Heading>Klados Admin Panel</Heading>
          <Flex asChild gap="4">
            <nav>
              <Link to="/">Visit Site</Link>
              <Link to="/logout">Log Out</Link>
            </nav>
          </Flex>
        </header>
      </Flex>
      <Flex flexGrow="1">
        <NavSidebar.Root>
          <NavSidebar.Item to="/admin" active={homeActive}>
            Dashboard
          </NavSidebar.Item>
          <NavSidebar.Item to="/admin/users" active={usersActive}>
            User Management
          </NavSidebar.Item>
        </NavSidebar.Root>
        <Outlet />
      </Flex>
    </div>
  );
}
