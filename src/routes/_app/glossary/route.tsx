import { TabNav } from "@radix-ui/themes";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentOutlet } from "../../../components/ContentContainer";
import { useIsActive } from "../../../lib/hooks/useIsActive";

export const Route = createFileRoute("/_app/glossary")({
  component: RouteComponent,
});

// TODO: fix needing search on nav (here it should probably remain to reset, though)
function RouteComponent() {
  const charactersActive = useIsActive("/glossary/characters", true);
  const traitsActive = useIsActive("/glossary/traits", true);
  const groupsActive = useIsActive("/glossary/groups", true);

  return (
    <ContentOutlet align="stretch">
      <TabNav.Root mb="3" size="2">
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
            Trait Sets
          </Link>
        </TabNav.Link>
      </TabNav.Root>
    </ContentOutlet>
  );
}
