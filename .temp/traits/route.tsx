import NiceModal from "@ebay/nice-modal-react";
import { Box, Flex, IconButton, Text, TextField } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PiLink, PiMagnifyingGlass, PiPlusCircle, PiTag } from "react-icons/pi";
import { CuratorOnly } from "../../src/components/CuratorOnly";
import { PaginationFooter } from "../../src/components/PaginationFooter";
import { DebouncedTextField } from "../../src/components/inputs/DebouncedTextField";
import { usePaginatedSearch } from "../../src/lib/hooks/usePaginatedSearch";
import { routeSeo } from "../../src/lib/utils/head/routeSeo";
import { SearchWithQuerySchema } from "../../src/lib/validation/search";
import { GlossarySidebarLayout } from "../../src/routes/_app/glossary/-chrome/GlossarySidebarLayout";
import { GlossarySidebarList } from "../../src/routes/_app/glossary/-chrome/GlossarySidebarList";
import { AddTraitSetModal } from "./-AddTraitSetModal";

export const Route = createFileRoute("/_app/glossary/traits")({
  validateSearch: SearchWithQuerySchema,
  loaderDeps: ({ search: { page, pageSize: pageSize, q } }) => ({
    page,
    pageSize,
    q,
  }),
  loader: async ({ context, deps: { page, pageSize, q } }) => {
    await context.queryClient.ensureQueryData(
      traitSetsQueryOptions(page, pageSize, { q }),
    );
  },
  head: () =>
    routeSeo({
      title: "Browse Trait Sets | Klados",
    }),
  component: RouteComponent,
});

function RouteComponent() {
  const { search, setQ, next, prev } = usePaginatedSearch();
  const { data: paginatedResult } = useSuspenseQuery(
    traitSetsQueryOptions(search.page, search.pageSize, {
      q: search.q,
    }),
  );

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
                  onClick={() => NiceModal.show(AddTraitSetModal)}
                  size="1"
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
              sub={item.key}
              label={item.label}
              to="/glossary/traits/$id"
              params={{ id: item.id }}
              search={{ ...search, valuePage: 1 }}
            >
              <Flex align="center" gap="1" asChild>
                <Text as="div" size="1">
                  {item.valueCount} <PiTag />
                </Text>
              </Flex>
              <Flex align="center" gap="1" asChild>
                <Text as="div" size="1">
                  {item.usedByCharacters} <PiLink />
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
