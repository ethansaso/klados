import { TabNav } from "@radix-ui/themes";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentContainer } from "../../../components/ContentContainer";
import { useIsActive } from "../../../lib/hooks/useIsActive";

export const Route = createFileRoute("/_app/characters")({
  component: RouteComponent,
});

// TODO: fix needing search on nav (here it should probably remain to reset, though)
function RouteComponent() {
  const definitionsActive = useIsActive("/characters/definitions", true);
  const optionsActive = useIsActive("/characters/options", true);
  const groupsActive = useIsActive("/characters/groups", true);

  return (
    <ContentContainer align="stretch">
      <TabNav.Root>
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
        <TabNav.Link asChild active={optionsActive}>
          <Link
            to="/characters/options"
            preload="intent"
            search={{ q: "", page: 1, pageSize: 20 }}
          >
            Option Sets
          </Link>
        </TabNav.Link>
      </TabNav.Root>
    </ContentContainer>
  );
}
