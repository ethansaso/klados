import NiceModal from "@ebay/nice-modal-react";
import { Box, Flex, IconButton, Text, TextField } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PiMagnifyingGlass, PiPlusCircle, PiTag } from "react-icons/pi";
import { GlossarySidebarLayout } from "../-chrome/GlossarySidebarLayout";
import { GlossarySidebarList } from "../-chrome/GlossarySidebarList";
import { CuratorOnly } from "../../../../components/CuratorOnly";
import { PaginationFooter } from "../../../../components/PaginationFooter";
import { ModifierIcon } from "../../../../components/icons/modular/ModifierIcon";
import { DebouncedTextField } from "../../../../components/inputs/DebouncedTextField";
import { usePaginatedSearch } from "../../../../lib/hooks/usePaginatedSearch";
import { modifierGroupsQueryOptions } from "../../../../lib/queries/modifiers";
import { routeSeo } from "../../../../lib/utils/head/routeSeo";
import { SearchWithQuerySchema } from "../../../../lib/validation/search";
import { AddModifierGroupModal } from "./-AddModifierGroupModal";

export const Route = createFileRoute("/_app/glossary/modifiers")({
  validateSearch: SearchWithQuerySchema,
  loaderDeps: ({ search: { page, pageSize: pageSize, q } }) => ({
    page,
    pageSize,
    q,
  }),
  loader: async ({ context, deps: { page, pageSize, q } }) => {
    await context.queryClient.ensureQueryData(
      modifierGroupsQueryOptions(page, pageSize, { q }),
    );
  },
  head: () =>
    routeSeo({
      title: "Browse Modifiers | Klados",
    }),
  component: RouteComponent,
});

function RouteComponent() {
  const { search, setQ, next, prev } = usePaginatedSearch();
  const { data: paginatedResult } = useSuspenseQuery(
    modifierGroupsQueryOptions(search.page, search.pageSize, {
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
                  onClick={() =>
                    NiceModal.show(AddModifierGroupModal, {
                      initialLabel: search.q,
                    })
                  }
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
              sub={item.description}
              label={
                <Flex align="center" gap="1">
                  <ModifierIcon type={item.class} />
                  {item.label}
                </Flex>
              }
              to="/glossary/modifiers/$id"
              params={{ id: item.id }}
              search={{ ...search }}
            >
              <Flex align="center" gap="1" asChild>
                <Text as="div" size="1">
                  {item.valueCount} <PiTag />
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
