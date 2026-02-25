import "../../../assets/styles/pages/glossary/glossary.css";

import { Flex, TabNav } from "@radix-ui/themes";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useIsActive } from "../../../lib/hooks/useIsActive";

export const Route = createFileRoute("/_app/glossary")({
  component: RouteComponent,
});

// TODO: fix needing search on nav (here it should probably remain to reset, though)
function RouteComponent() {
  const charactersActive = useIsActive("/glossary/characters", true);
  const featuresActive = useIsActive("/glossary/features", true);
  const modifiersActive = useIsActive("/glossary/modifiers", true);

  return (
    <Flex direction="column" flexGrow="1">
      <TabNav.Root size="2">
        <TabNav.Link asChild active={featuresActive}>
          <Link to="/glossary/features" preload="intent">
            Features
          </Link>
        </TabNav.Link>
        <TabNav.Link asChild active={charactersActive}>
          <Link to="/glossary/characters" preload="intent">
            Characters
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
