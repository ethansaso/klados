import { Flex, TextField } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PiMagnifyingGlass } from "react-icons/pi";
import { useDebounce } from "use-debounce";
import {
  TaxonSearchParams,
  TaxonSearchSchema,
} from "../../../lib/domain/taxa/search";
import { taxaQueryOptions } from "../../../lib/queries/taxa";
import { TaxaFilterPopover } from "./-TaxonFilterPopover";
import { TaxonGrid } from "./-TaxonGrid";
import { useTaxonSearchControls } from "./-useTaxonSearchControls";

export const Route = createFileRoute("/_app/taxa/")({
  validateSearch: TaxonSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const { page, pageSize, q, status, highRank, lowRank, hasMedia } =
      deps as TaxonSearchParams;

    await context.queryClient.ensureQueryData(
      taxaQueryOptions(page, pageSize, {
        q,
        status,
        highRank,
        lowRank,
        hasMedia,
      })
    );
  },
  component: TaxaListPage,
});

function TaxaListPage() {
  const { search, setSearch } = useTaxonSearchControls();

  const { data: paginatedResult } = useSuspenseQuery(
    taxaQueryOptions(search.page, search.pageSize, {
      q: search.q,
      status: search.status,
      highRank: search.highRank,
      lowRank: search.lowRank,
      hasMedia: search.hasMedia,
    })
  );

  // Debounced into search
  const [localInput, setLocalInput] = useState(search.q ?? "");
  useEffect(() => {
    setLocalInput(search.q ?? "");
  }, [search.q]);
  const [debouncedInput] = useDebounce(localInput, 250);
  useEffect(() => {
    setSearch({
      q: debouncedInput || undefined,
    });
  }, [debouncedInput, setSearch]);

  return (
    <Flex direction="column">
      <Flex mb="4" gap="2">
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
        <TaxaFilterPopover search={search} setSearch={setSearch} />
      </Flex>
      <TaxonGrid results={paginatedResult} />
    </Flex>
  );
}
