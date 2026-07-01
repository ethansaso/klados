import { Button, Dialog, Flex, IconButton, TabNav } from "@radix-ui/themes";
import { Link as RouterLink } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PiCaretDown, PiList } from "react-icons/pi";
import { roleHasCuratorRights } from "../../lib/auth/utils";
import { useIsActive } from "../../lib/hooks/useIsActive";
import { useMediaQuery } from "../../lib/hooks/useMediaQuery";
import { getMeFn } from "../../lib/server-fns/users/getMeFn";
import { NavBarBrand } from "./NavBarBrand";
import { NavDropdown } from "./NavDropdown";
import { NavSheet } from "./NavSheet";
import { UserMenu } from "./UserMenu";

interface NavBarProps {
  user: Awaited<ReturnType<typeof getMeFn>> | undefined;
}

export function NavBar({ user }: NavBarProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [expanded, setExpanded] = useState(false);

  const taxaActive = useIsActive("/taxa", true);
  const glossaryActive = useIsActive("/glossary", true);
  const guidesActive = useIsActive("/guides", true);
  const moreActive = useIsActive(["/users", "/about", "/donate", "/tos"], true);

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
        display={{ initial: "none", sm: "flex" }}
      >
        {TaxaItem}

        <TabNav.Link asChild active={guidesActive}>
          <RouterLink to="/guides" preload="intent">
            Guides
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
            <NavDropdown.Separator />
            <NavDropdown.Link to="/tos">Terms of Service</NavDropdown.Link>
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
      {/* Mobile hamburger + sheet */}
      {isMobile ? (
        <Dialog.Root open={expanded} onOpenChange={setExpanded}>
          <Dialog.Trigger>
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
          </Dialog.Trigger>

          <NavSheet user={user} onNavigate={() => setExpanded(false)} />
        </Dialog.Root>
      ) : null}
    </TabNav.Root>
  );
}
