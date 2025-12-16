import { Box, Button, Flex, TextField } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PiMagnifyingGlass } from "react-icons/pi";
import { DebouncedTextField } from "../../../../components/inputs/DebouncedTextField";
import { PaginationFooter } from "../../../../components/PaginationFooter";
import { useSectionSearch } from "../../../../lib/hooks/useSectionSearch";
import { keysQueryOptions } from "../../../../lib/queries/keys";
import { SearchWithQuerySchema } from "../../../../lib/validation/search";
import { KeyTable } from "./-KeyTable";

export const Route = createFileRoute("/_app/keys/_browsing/")({
  validateSearch: SearchWithQuerySchema,
  loaderDeps: ({ search: { page, pageSize: pageSize, q } }) => ({
    page,
    pageSize,
    q,
  }),
  loader: async ({ context, deps: { page, pageSize, q } }) => {
    await context.queryClient.ensureQueryData(
      keysQueryOptions(page, pageSize, { q })
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { search, setQ, next, prev } = useSectionSearch(Route);
  const {
    data: { items, page: currentPage, pageSize: currentPageSize, total },
  } = useSuspenseQuery(
    keysQueryOptions(search.page, search.pageSize, { q: search.q })
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
          Create New Key
        </Button>
      </Box>
      <Box mb="4">
        <DebouncedTextField
          placeholder="Search keys..."
          id="taxa-search"
          initialValue={search.q}
          onDebouncedChange={(value) => setQ(value)}
        >
          <TextField.Slot>
            <PiMagnifyingGlass size="16" />
          </TextField.Slot>
        </DebouncedTextField>
      </Box>
      <KeyTable items={items} />
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
