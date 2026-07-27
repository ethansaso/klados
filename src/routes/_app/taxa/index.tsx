import { Container, Flex, Heading, TextField } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PiMagnifyingGlass } from "react-icons/pi";
import { useDebounce } from "use-debounce";
import { ContentContainer } from "../../../components/ContentContainer";
import {
  DEFAULT_TAXON_STATUSES,
  type TaxonSearchParams,
  TaxonSearchSchema,
} from "../../../lib/domain/taxa/search";
import { taxaQueryOptions } from "../../../lib/queries/taxa";
import { routeSeo } from "../../../lib/utils/head/routeSeo";
import { TaxonFilters } from "./-components/TaxonFilters";
import { TaxonGrid } from "./-components/TaxonGrid";
import { useTaxonSearchControls } from "./-hooks/useTaxonSearchControls";
import "./index.css";

export const Route = createFileRoute("/_app/taxa/")({
  validateSearch: TaxonSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const {
      page,
      pageSize,
      q,
      status,
      highRank,
      lowRank,
      hasMedia,
      hasMorphology,
      hasEcology,
    } = deps as TaxonSearchParams;

    await context.queryClient.ensureQueryData(
      taxaQueryOptions(page, pageSize, {
        q,
        status,
        highRank,
        lowRank,
        hasMedia,
        hasMorphology,
        hasEcology,
      }),
    );
  },
  search: {
    middlewares: [stripSearchParams({ status: DEFAULT_TAXON_STATUSES })],
  },
  head: ({ match }) =>
    routeSeo({
      title: "Taxa | Klados",
      canonicalUrl: match.pathname,
    }),
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
      hasMorphology: search.hasMorphology,
      hasEcology: search.hasEcology,
    }),
  );

  // Debounced into search, and synced from search for external changes
  const [localInput, setLocalInput] = useState(search.q ?? "");
  const [debouncedInput, { cancel }] = useDebounce(localInput, 250);
  useEffect(() => {
    const next = search.q ?? "";

    // Cancel any pending to avoid stale updates
    cancel();

    // Avoid setting if unnecessary (i.e. identical)
    // eslint-disable-next-line @eslint-react/set-state-in-effect
    setLocalInput((prev) => (prev === next ? prev : next));
  }, [search.q, cancel]);
  useEffect(() => {
    setSearch({ q: debouncedInput || undefined });
  }, [debouncedInput, setSearch]);

  return (
    <>
      <Container className="taxa-search-bar" p="4" flexGrow="0">
        <Flex direction="column" gap="2">
          <Heading>Browse Taxa</Heading>
          <Flex gap="2">
            <TextField.Root
              placeholder="Search by common or scientific name..."
              id="taxa-search"
              value={localInput}
              onChange={(e) => setLocalInput(e.currentTarget.value)}
            >
              <TextField.Slot>
                <PiMagnifyingGlass size="16" />
              </TextField.Slot>
            </TextField.Root>
            <TaxonFilters search={search} setSearch={setSearch} />
          </Flex>
        </Flex>
      </Container>
      <ContentContainer align="start" gray>
        <TaxonGrid results={paginatedResult} />
      </ContentContainer>
    </>
  );
}
