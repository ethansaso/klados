import { Box, Flex, TextField } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PiMagnifyingGlass } from "react-icons/pi";
import { taxaQueryOptions } from "../../../lib/queries/taxa";
import { TaxonGrid } from "./-TaxonGrid";

export const Route = createFileRoute("/_app/taxa/")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(taxaQueryOptions(1, 20));
  },
  component: TaxaList,
});

function TaxaList() {
  const [search, setSearch] = useState("");
  const { data: paginatedResult } = useSuspenseQuery(
    taxaQueryOptions(1, 20, search)
  );

  return (
    <Flex direction="column">
      <Box mb="4">
        <TextField.Root
          placeholder="Search taxa..."
          id="taxa-search"
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        >
          <TextField.Slot>
            <PiMagnifyingGlass size="16" />
          </TextField.Slot>
        </TextField.Root>
      </Box>
      <TaxonGrid paginatedResult={paginatedResult} />
    </Flex>
  );
}
