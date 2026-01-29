import { Flex, TabNav } from "@radix-ui/themes";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useIsActive } from "../../../lib/hooks/useIsActive";

import glossaryCssUrl from "../../../assets/styles/pages/glossary/glossary.css?url";

export const Route = createFileRoute("/_app/glossary")({
  head: () => ({
    links: [{ rel: "stylesheet", href: glossaryCssUrl }],
  }),
  component: RouteComponent,
});

// TODO: fix needing search on nav (here it should probably remain to reset, though)
function RouteComponent() {
  const charactersActive = useIsActive("/glossary/characters", true);
  const groupsActive = useIsActive("/glossary/groups", true);
  const traitsActive = useIsActive("/glossary/traits", true);
  const modifiersActive = useIsActive("/glossary/modifiers", true);

  return (
    <Flex direction="column" flexGrow="1">
      <TabNav.Root size="2">
        <TabNav.Link asChild active={charactersActive}>
          <Link to="/glossary/characters" preload="intent">
            Characters
          </Link>
        </TabNav.Link>
        <TabNav.Link asChild active={groupsActive}>
          <Link to="/glossary/groups" preload="intent">
            Groups
          </Link>
        </TabNav.Link>
        <TabNav.Link asChild active={traitsActive}>
          <Link to="/glossary/traits" preload="intent">
            Traits
          </Link>
        </TabNav.Link>
        <TabNav.Link asChild active={modifiersActive}>
          <Link to="/glossary/modifiers" preload="intent">
            Modifiers
          </Link>
        </TabNav.Link>
      </TabNav.Root>
      <Outlet />
    </Flex>
  );
}
