import NiceModal from "@ebay/nice-modal-react";
import { Box, Flex, IconButton, Text, TextField } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, useMatchRoute } from "@tanstack/react-router";
import { PiLink, PiMagnifyingGlass, PiPlusCircle, PiTag } from "react-icons/pi";
import { CharacterSectionSidebarList } from "../-chrome/CharacterSectionSidebarList";
import { Pager } from "../-chrome/CharacterSectionSidebarPager";
import { useSectionSearch } from "../-chrome/useSectionSearch";
import { DebouncedTextField } from "../../../../components/inputs/DebouncedTextField";
import { traitSetsQueryOptions } from "../../../../lib/queries/traits";
import { SearchWithQuerySchema } from "../../../../lib/validation/search";
import { AddTraitSetModal } from "./-AddTraitSetModal";

export const Route = createFileRoute("/_app/characters/traits")({
  validateSearch: (s) => SearchWithQuerySchema.parse(s),
  loaderDeps: ({ search: { page, pageSize, q } }) => ({ page, pageSize, q }),
  loader: async ({ context, deps: { page, pageSize, q } }) => {
    await context.queryClient.ensureQueryData(
      traitSetsQueryOptions(page, pageSize, { q })
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { search, setQ, next, prev } = useSectionSearch(Route);
  const { data: paginatedResult } = useSuspenseQuery(
    traitSetsQueryOptions(search.page, search.pageSize, {
      q: search.q,
    })
  );

  const matchRoute = useMatchRoute();
  const match = matchRoute({ to: "/characters/traits/$setId", fuzzy: true });
  const selectedId = match ? (match.setId as string | undefined) : undefined;

  return (
    <Flex gap="4">
      <Box width="275px">
        <DebouncedTextField
          initialValue={search.q}
          onDebouncedChange={(value) => setQ(value)}
          mb="2"
        >
          <TextField.Slot>
            <PiMagnifyingGlass size="16" />
          </TextField.Slot>
          <TextField.Slot>
            <IconButton
              onClick={() => NiceModal.show(AddTraitSetModal)}
              size="1"
            >
              <PiPlusCircle />
            </IconButton>
          </TextField.Slot>
        </DebouncedTextField>
        <CharacterSectionSidebarList.Root selectedId={selectedId}>
          {paginatedResult.items.map((item) => (
            <CharacterSectionSidebarList.Item
              key={item.id}
              id={item.id}
              keyStr={item.key}
              label={item.label}
              to="/characters/traits/$setId"
              params={{ setId: String(item.id) }}
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
            </CharacterSectionSidebarList.Item>
          ))}
        </CharacterSectionSidebarList.Root>
        <Pager
          page={paginatedResult.page}
          pageSize={paginatedResult.pageSize}
          total={paginatedResult.total}
          onPrev={() => prev()}
          onNext={() => next(paginatedResult.total)}
        />
      </Box>
      <Outlet />
    </Flex>
  );
}
