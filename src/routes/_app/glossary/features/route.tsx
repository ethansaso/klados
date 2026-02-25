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
import { featuresQueryOptions } from "../../../../lib/queries/features";
import { routeSeo } from "../../../../lib/utils/head/routeSeo";
import { SearchWithQuerySchema } from "../../../../lib/validation/search";
import { AddFeatureModal } from "./-AddFeatureModal";

export const Route = createFileRoute("/_app/glossary/features")({
  validateSearch: SearchWithQuerySchema,
  loaderDeps: ({ search: { page, pageSize: pageSize, q } }) => ({
    page,
    pageSize,
    q,
  }),
  loader: async ({ context, deps: { page, pageSize, q } }) => {
    await context.queryClient.ensureQueryData(
      featuresQueryOptions(page, pageSize, { q }),
    );
  },
  head: () =>
    routeSeo({
      title: "Browse Features | Klados",
    }),
  component: RouteComponent,
});

function RouteComponent() {
  const { search, setQ, next, prev } = usePaginatedSearch();
  const { data: paginatedResult } = useSuspenseQuery(
    featuresQueryOptions(search.page, search.pageSize, {
      q: search.q,
    }),
  );

  // const matchRoute = useMatchRoute();
  // const match = matchRoute({ to: "/glossary/features/$featureId", fuzzy: true });
  // const selectedId = match ? (match.featureId as string | undefined) : undefined;

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
                  onClick={() =>
                    NiceModal.show(AddFeatureModal, { initialLabel: search.q })
                  }
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
              label={item.label}
              to="/glossary/features/$id"
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
