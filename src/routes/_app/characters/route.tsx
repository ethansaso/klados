import { Heading, TabNav } from "@radix-ui/themes";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentContainer } from "../../../components/ContentContainer";
import { useIsActive } from "../../../lib/hooks/useIsActive";

export const Route = createFileRoute("/_app/characters")({
  component: RouteComponent,
});

// TODO: fix needing search on nav (here it should probably remain to reset, though)
function RouteComponent() {
  const definitionsActive = useIsActive("/characters/definitions", true);
  const traitsActive = useIsActive("/characters/traits", true);
  const groupsActive = useIsActive("/characters/groups", true);

  return (
    <ContentContainer align="stretch">
      <Heading mb="2">Character glossary</Heading>
      <TabNav.Root mb="3">
        <TabNav.Link asChild active={definitionsActive}>
          <Link
            to="/characters/definitions"
            preload="intent"
            search={{ q: "", page: 1, pageSize: 20 }}
          >
            Definitions
          </Link>
        </TabNav.Link>
        <TabNav.Link asChild active={groupsActive}>
          <Link
            to="/characters/groups"
            preload="intent"
            search={{ q: "", page: 1, pageSize: 20 }}
          >
            Groups
          </Link>
        </TabNav.Link>
        <TabNav.Link asChild active={traitsActive}>
          <Link
            to="/characters/traits"
            preload="intent"
            search={{ q: "", page: 1, pageSize: 20 }}
          >
            Trait Sets
          </Link>
        </TabNav.Link>
      </TabNav.Root>
    </ContentContainer>
  );
}
