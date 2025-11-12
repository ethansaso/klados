import { Heading, TabNav } from "@radix-ui/themes";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentContainer } from "../../../components/ContentContainer";
import { useIsActive } from "../../../lib/hooks/useIsActive";

export const Route = createFileRoute("/_app/glossary")({
  component: RouteComponent,
});

// TODO: fix needing search on nav (here it should probably remain to reset, though)
function RouteComponent() {
  const definitionsActive = useIsActive("/glossary/characters", true);
  const traitsActive = useIsActive("/glossary/traits", true);
  const groupsActive = useIsActive("/glossary/groups", true);

  return (
    <ContentContainer align="stretch">
      <Heading mb="2">Glossary</Heading>
      <TabNav.Root mb="3">
        <TabNav.Link asChild active={definitionsActive}>
          <Link to="/glossary/characters" preload="intent">
            Definitions
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
    </ContentContainer>
  );
}
