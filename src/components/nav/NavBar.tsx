import {
  Button,
  Flex,
  IconButton,
  Link as RtLink,
  TabNav,
  Text,
} from "@radix-ui/themes";
import { Link as RouterLink } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PiCaretDown, PiList } from "react-icons/pi";
import { getMeFn } from "../../lib/api/users/getMe";
import { roleHasCuratorRights } from "../../lib/auth/utils";
import { useIsActive } from "../../lib/hooks/useIsActive";
import { Logo } from "./Logo";
import { NavDropdown } from "./NavDropdown";
import { UserMenu } from "./UserMenu";

interface NavBarProps {
  user: Awaited<ReturnType<typeof getMeFn>> | undefined;
}

function NavBarBrand() {
  return (
    <RtLink asChild underline="none" highContrast>
      <RouterLink to="/" preload="intent">
        <Flex align="center" gap="2" px="2" py="1" mr="4">
          <Logo size={24} />
          <Text weight="bold" size="6">
            Klados
          </Text>
        </Flex>
      </RouterLink>
    </RtLink>
  );
}

export function NavBar({ user }: NavBarProps) {
  const [expanded, setExpanded] = useState(false);

  const homeActive = useIsActive("/");
  const taxaActive = useIsActive("/taxa", true);
  const glossaryActive = useIsActive("/glossary", true);
  const keysActive = useIsActive("/keys", true);
  const moreActive = useIsActive(["/users", "/about"], true);

  const TaxaItem = useMemo(() => {
    if (roleHasCuratorRights(user?.role)) {
      return (
        <NavDropdown.Root>
          <NavDropdown.Trigger
            to="/taxa"
            active={taxaActive}
            style={{ gap: "var(--space-1)" }}
          >
            Taxa
            <PiCaretDown size="10" />
          </NavDropdown.Trigger>
          <NavDropdown.Content>
            <NavDropdown.Link to="/taxa">Browse taxa</NavDropdown.Link>
            <NavDropdown.Separator />
            <NavDropdown.Link to="/taxa/new">Create taxon</NavDropdown.Link>
            <NavDropdown.Link to="/taxa/drafts">Drafts</NavDropdown.Link>
          </NavDropdown.Content>
        </NavDropdown.Root>
      );
    } else {
      return (
        <TabNav.Link asChild active={taxaActive}>
          <RouterLink to="/taxa" preload="intent">
            Taxa
          </RouterLink>
        </TabNav.Link>
      );
    }
  }, [user, taxaActive]);

  return (
    <TabNav.Root className="navbar">
      <NavBarBrand />
      <Flex
        className="navbar__navlinks"
        display={{ initial: expanded ? "flex" : "none", sm: "flex" }}
      >
        <TabNav.Link asChild active={homeActive}>
          <RouterLink to="/" preload="intent">
            Home
          </RouterLink>
        </TabNav.Link>

        {TaxaItem}

        <TabNav.Link asChild active={keysActive}>
          <RouterLink to="/keys" preload="intent">
            Keys
          </RouterLink>
        </TabNav.Link>

        <TabNav.Link asChild active={glossaryActive}>
          <RouterLink to="/glossary" preload="intent">
            Glossary
          </RouterLink>
        </TabNav.Link>

        <NavDropdown.Root>
          <NavDropdown.Trigger
            active={moreActive}
            style={{ gap: "var(--space-1)" }}
          >
            More <PiCaretDown size="10" />
          </NavDropdown.Trigger>
          <NavDropdown.Content>
            <NavDropdown.Link to="/users">Users</NavDropdown.Link>
            <NavDropdown.Link to="/about">About</NavDropdown.Link>
            <NavDropdown.Link to="/donate">Donate</NavDropdown.Link>
          </NavDropdown.Content>
        </NavDropdown.Root>
      </Flex>

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
      <Flex align="center" display={{ initial: "flex", sm: "none" }}>
        <IconButton
          variant="ghost"
          size="2"
          aria-label="Open menu"
          mx="2"
          onClick={() => setExpanded(!expanded)}
        >
          <PiList />
        </IconButton>
      </Flex>
    </TabNav.Root>
  );
}
