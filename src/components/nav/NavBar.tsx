import { Link as RtLink, Flex, Text, TabNav } from "@radix-ui/themes";
import { Link as RouterLink, useRouterState } from "@tanstack/react-router";
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

      <UserMenu
        name="Ethan Saso"
        email="email@email.email"
        initials="ES"
        style={{ marginLeft: "auto" }}
        // imageUrl="/avatar.png"
      />
    </TabNav.Root>
  );
}
