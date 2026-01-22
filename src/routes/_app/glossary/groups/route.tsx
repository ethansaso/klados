import NiceModal from "@ebay/nice-modal-react";
import { Box, Flex, IconButton, Text, TextField } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PiGraphFill, PiMagnifyingGlass, PiPlusCircle } from "react-icons/pi";
import { GlossarySidebarLayout } from "../-chrome/GlossarySidebarLayout";
import { GlossarySidebarList } from "../-chrome/GlossarySidebarList";
import { CuratorOnly } from "../../../../components/CuratorOnly";
import { PaginationFooter } from "../../../../components/PaginationFooter";
import { DebouncedTextField } from "../../../../components/inputs/DebouncedTextField";
import { usePaginatedSearch } from "../../../../lib/hooks/usePaginatedSearch";
import { characterGroupsQueryOptions } from "../../../../lib/queries/characterGroups";
import { routeSeo } from "../../../../lib/utils/head/routeSeo";
import { SearchWithQuerySchema } from "../../../../lib/validation/search";
import { AddCharacterGroupModal } from "./-AddCharacterGroupModal";

export const Route = createFileRoute("/_app/glossary/groups")({
  head: () =>
    routeSeo({
      title: "Browse Character Groups | Klados",
    }),
  validateSearch: SearchWithQuerySchema,
  loaderDeps: ({ search: { page, pageSize: pageSize, q } }) => ({
    page,
    pageSize,
    q,
  }),
  loader: async ({ context, deps: { page, pageSize, q } }) => {
    await context.queryClient.ensureQueryData(
      characterGroupsQueryOptions(page, pageSize, { q }),
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { search, setQ, next, prev } = usePaginatedSearch();
  const { data: paginatedResult } = useSuspenseQuery(
    characterGroupsQueryOptions(search.page, search.pageSize, {
      q: search.q,
    }),
  );

  // const matchRoute = useMatchRoute();
  // const match = matchRoute({ to: "/glossary/groups/$groupId", fuzzy: true });
  // const selectedId = match ? (match.groupId as string | undefined) : undefined;

  return (
    <GlossarySidebarLayout.Root>
      <GlossarySidebarLayout.Sidebar>
        <Box p="3">
          <DebouncedTextField
            initialValue={search.q}
            onDebouncedChange={(value) => setQ(value)}
            radius="large"
          >
            <TextField.Slot>
              <PiMagnifyingGlass size="16" />
            </TextField.Slot>
            <CuratorOnly>
              <TextField.Slot>
                <IconButton
                  size="1"
                  onClick={() => NiceModal.show(AddCharacterGroupModal)}
                >
                  <PiPlusCircle />
                </IconButton>
              </TextField.Slot>
            </CuratorOnly>
          </DebouncedTextField>
        </Box>
        <GlossarySidebarList.List>
          {paginatedResult.items.map((item) => (
            <GlossarySidebarList.Item
              key={item.id}
              keyStr={item.key}
              label={item.label}
              to="/glossary/groups/$id"
              params={{ id: item.id }}
              search={search}
            >
              <Flex align="center" gap="1" asChild>
                <Text as="div" size="1">
                  {item.characterCount}
                  <PiGraphFill />
                </Text>
              </Flex>
            </GlossarySidebarList.Item>
          ))}
        </GlossarySidebarList.List>
        <Box mt="auto" p="3" pt="0">
          <PaginationFooter
            page={paginatedResult.page}
            pageSize={paginatedResult.pageSize}
            total={paginatedResult.total}
            onPrev={() => prev()}
            onNext={() => next(paginatedResult.total)}
          />
        </Box>
      </GlossarySidebarLayout.Sidebar>
      <GlossarySidebarLayout.Separator />
      <GlossarySidebarLayout.Content />
    </GlossarySidebarLayout.Root>
  );
}
