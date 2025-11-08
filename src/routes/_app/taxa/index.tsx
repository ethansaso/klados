import { Box, Flex, TextField } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PiMagnifyingGlass } from "react-icons/pi";
import { taxaQueryOptions } from "../../../lib/queries/taxa";
import { SearchWithQuerySchema } from "../../../lib/validation/search";
import { TaxonGrid } from "./-TaxonGrid";

export const Route = createFileRoute("/_app/taxa/")({
  validateSearch: (s) => SearchWithQuerySchema.parse(s),
  loaderDeps: ({ search: { page, pageSize, q } }) => ({ page, pageSize, q }),
  loader: async ({ context, deps: { page, pageSize, q } }) => {
    await context.queryClient.ensureQueryData(
      taxaQueryOptions(page, pageSize, { q, status: "active" })
    );
  },
  component: TaxaListPage,
});

function TaxaListPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: paginatedResult } = useSuspenseQuery(
    taxaQueryOptions(search.page, search.pageSize, {
      q: search.q,
      status: "active",
    })
  );

  // Debounced into search
  const [localInput, setLocalInput] = useState(search.q ?? "");
  useEffect(() => {
    setLocalInput(search.q ?? "");
  }, [search.q]);
  useEffect(() => {
    const id = setTimeout(() => {
      navigate({
        search: (prev) => ({ ...prev, q: localInput, page: 1 }),
        replace: true,
      });
    }, 250);
    return () => clearTimeout(id);
  }, [localInput, navigate]);

  return (
    <Flex direction="column">
      <Box mb="4">
        <TextField.Root
          placeholder="Search taxa..."
          id="taxa-search"
          value={localInput}
          onChange={(e) => setLocalInput(e.currentTarget.value)}
        >
          <TextField.Slot>
            <PiMagnifyingGlass size="16" />
          </TextField.Slot>
        </TextField.Root>
      </Box>
      <TaxonGrid results={paginatedResult} />
    </Flex>
  );
}
