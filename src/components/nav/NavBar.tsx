import { Button, Flex, Link as RtLink, TabNav, Text } from "@radix-ui/themes";
import { Link as RouterLink } from "@tanstack/react-router";
import { useStrictSession } from "../../lib/auth/useStrictSession";
import { useIsActive } from "../../lib/hooks/useIsActive";
import { Logo } from "./Logo";
import { UserMenu } from "./UserMenu";

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
  const { data } = useStrictSession();

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

      {data ? (
        <UserMenu
          name={data.user.name}
          email={data.user.email}
          username={data.user.username}
          imageUrl={data.user.image ?? undefined}
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
