import { Box, Button, Flex, TextField } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PiMagnifyingGlass } from "react-icons/pi";
import { DebouncedTextField } from "../../../../components/inputs/DebouncedTextField";
import { PaginationFooter } from "../../../../components/PaginationFooter";
import { usePaginatedSearch } from "../../../../lib/hooks/usePaginatedSearch";
import { guidesQueryOptions } from "../../../../lib/queries/guides";
import { routeSeo } from "../../../../lib/utils/head/routeSeo";
import { SearchWithQuerySchema } from "../../../../lib/validation/search";
import { GuideTable } from "./-GuideTable";

export const Route = createFileRoute("/_app/guides/_browsing/")({
  head: () => routeSeo({ title: "Browse Guides | Klados" }),
  validateSearch: SearchWithQuerySchema,
  loaderDeps: ({ search: { page, pageSize: pageSize, q } }) => ({
    page,
    pageSize,
    q,
  }),
  loader: async ({ context, deps: { page, pageSize, q } }) => {
    await context.queryClient.ensureQueryData(
      guidesQueryOptions(page, pageSize, { q }),
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { search, setQ, next, prev } = usePaginatedSearch();
  const {
    data: { items, page: currentPage, pageSize: currentPageSize, total },
  } = useSuspenseQuery(
    guidesQueryOptions(search.page, search.pageSize, { q: search.q }),
  );

  const handlePrev = () => {
    next(total);
  };

  const handleNext = () => {
    prev();
  };

  return (
    <Flex direction="column">
      <Box mb="4">
        <Button onClick={() => navigate({ to: "create" })}>
          Create New Guide
        </Button>
      </Box>
      <Box mb="4">
        <DebouncedTextField
          placeholder="Search guides..."
          id="guides-search"
          initialValue={search.q}
          onDebouncedChange={(value) => setQ(value)}
        >
          <TextField.Slot>
            <PiMagnifyingGlass size="16" />
          </TextField.Slot>
        </DebouncedTextField>
      </Box>
      <GuideTable items={items} />
      <PaginationFooter
        page={currentPage}
        pageSize={currentPageSize}
        total={total}
        onNext={handleNext}
        onPrev={handlePrev}
      />
    </Flex>
  );
}
