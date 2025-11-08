import NiceModal from "@ebay/nice-modal-react";
import { Box, Flex, IconButton, Text, TextField } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, useMatchRoute } from "@tanstack/react-router";
import { PiMagnifyingGlass, PiPlusCircle } from "react-icons/pi";
import { CharacterSectionSidebarList } from "../-chrome/CharacterSectionSidebarList";
import { Pager } from "../-chrome/CharacterSectionSidebarPager";
import { useSectionSearch } from "../-chrome/useSectionSearch";
import { DebouncedTextField } from "../../../../components/DebouncedTextField";
import { optionSetsQueryOptions } from "../../../../lib/queries/options";
import { SearchWithQuerySchema } from "../../../../lib/validation/search";
import { AddOptionSetModal } from "./-AddOptionSetModal";

export const Route = createFileRoute("/_app/characters/options")({
  validateSearch: (s) => SearchWithQuerySchema.parse(s),
  loaderDeps: ({ search: { page, pageSize, q } }) => ({ page, pageSize, q }),
  loader: async ({ context, deps: { page, pageSize, q } }) => {
    await context.queryClient.ensureQueryData(
      optionSetsQueryOptions(page, pageSize, { q })
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { search, setQ, next, prev } = useSectionSearch(Route);
  const {
    data: paginatedResult,
    isLoading,
    error,
  } = useQuery(
    optionSetsQueryOptions(search.page, search.pageSize, {
      q: search.q,
    })
  );

  const matchRoute = useMatchRoute();
  const match = matchRoute({ to: "/characters/options/$setId", fuzzy: true });
  const selectedId = match ? (match.setId as string | undefined) : undefined;

  return (
    <Flex gap="4">
      <Box maxWidth="300px">
        <DebouncedTextField value={search.q} onDebouncedChange={setQ} mb="2">
          <TextField.Slot>
            <PiMagnifyingGlass size="16" />
          </TextField.Slot>
          <TextField.Slot>
            <IconButton
              onClick={() => NiceModal.show(AddOptionSetModal)}
              size="1"
            >
              <PiPlusCircle />
            </IconButton>
          </TextField.Slot>
        </DebouncedTextField>

        {error ? (
          <Text color="red">Error loading option sets.</Text>
        ) : isLoading || !paginatedResult ? (
          <Text>Loading option sets...</Text>
        ) : paginatedResult.items.length > 0 ? (
          <>
            <CharacterSectionSidebarList.Root selectedId={selectedId}>
              {paginatedResult.items.map((item) => (
                <CharacterSectionSidebarList.Item
                  key={item.id}
                  id={item.id}
                  keyStr={item.key}
                  label={item.label}
                  to="/characters/options/$setId"
                  params={{ setId: String(item.id) }}
                />
              ))}
            </CharacterSectionSidebarList.Root>{" "}
            <Pager
              page={paginatedResult.page}
              pageSize={paginatedResult.pageSize}
              total={paginatedResult.total}
              onPrev={() => prev()}
              onNext={() => next(paginatedResult.total)}
            />
          </>
        ) : (
          <Text color="gray">No option sets found.</Text>
        )}
      </Box>
      <Outlet />
    </Flex>
  );
}
