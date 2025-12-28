import NiceModal from "@ebay/nice-modal-react";
import { Box, Flex, IconButton, Text, TextField } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PiLink, PiMagnifyingGlass, PiPlusCircle, PiTag } from "react-icons/pi";
import { GlossarySidebarLayout } from "../-chrome/GlossarySidebarLayout";
import { GlossarySidebarList } from "../-chrome/GlossarySidebarList";
import { CuratorOnly } from "../../../../components/CuratorOnly";
import { PaginationFooter } from "../../../../components/PaginationFooter";
import { DebouncedTextField } from "../../../../components/inputs/DebouncedTextField";
import { useGlossarySearch } from "../../../../lib/hooks/useGlossarySearch";
import { traitSetsQueryOptions } from "../../../../lib/queries/traits";
import { SearchWithQuerySchema } from "../../../../lib/validation/search";
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
      traitSetsQueryOptions(page, pageSize, { q })
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { search, setQ, next, prev } = useGlossarySearch(Route);
  const { data: paginatedResult } = useSuspenseQuery(
    traitSetsQueryOptions(search.page, search.pageSize, {
      q: search.q,
    })
  );

  return (
    <GlossarySidebarLayout.Root>
      <GlossarySidebarLayout.Sidebar>
        <DebouncedTextField
          initialValue={search.q}
          onDebouncedChange={(value) => setQ(value)}
          mb="3"
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
        <GlossarySidebarList.List>
          {paginatedResult.items.map((item) => (
            <GlossarySidebarList.Item
              key={item.id}
              keyStr={item.key}
              label={item.label}
              to="/glossary/traits/$setId"
              params={{ setId: String(item.id) }}
              search={{ valuePage: 1 }}
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
        <Box mt="auto">
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
