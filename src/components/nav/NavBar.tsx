import { Link as RtLink, Flex, Text, TabNav, Box, Button } from "@radix-ui/themes";
import { Link as RouterLink, useRouterState } from "@tanstack/react-router";
import { Route as RootRoute } from "../../routes/__root";
import { Logo } from "./Logo";
import { UserMenu } from "./UserMenu";

function useIsActive(to: string) {
  const { location } = useRouterState();
  return to === "/"
    ? location.pathname === "/"
    : location.pathname.startsWith(to);
}

function NavBarBrand() {
  return (
    <RtLink asChild underline="none" highContrast>
      <RouterLink to="/" preload="intent">
        <Flex align="center" gap="2" px="3" py="2">
          <Logo />
          <Text weight="bold" size="3">
            TaxoKeys
          </Text>
        </Flex>
      </RouterLink>
    </RtLink>
  );
}

export function NavBar() {
  const { user } = RootRoute.useLoaderData();

  const homeActive = useIsActive("/");
  const taxaActive = useIsActive("/taxa");
  const usersActive = useIsActive("/users");

  return (
    <TabNav.Root className="navbar">
      <NavBarBrand />
      <TabNav.Link asChild active={homeActive}>
        <RouterLink to="/" preload="intent">
          Home
        </RouterLink>
      </TabNav.Link>

      <TabNav.Link asChild active={taxaActive}>
        <RouterLink to="/taxa" preload="intent">
          Taxa
        </RouterLink>
      </TabNav.Link>

      <TabNav.Link asChild active={usersActive}>
        <RouterLink to="/users" preload="intent">
          Users
        </RouterLink>
      </TabNav.Link>

      {user ? (
        <UserMenu
          name={user.name}
          email={user.email}
          username={user.username}
          imageUrl={user.image ?? undefined}
          style={{ marginLeft: "auto" }}
        />
      ) : (
        <Flex gap={"5"} align="center" ml="auto" mr="3">
          <Button variant="ghost" asChild>
            <RouterLink to="/login">Log In</RouterLink>
          </Button>
          <Button variant="ghost" asChild>
            <RouterLink to="/signup">Sign Up</RouterLink>
          </Button>
        </Flex>
      )}
    </TabNav.Root>
  );
}
