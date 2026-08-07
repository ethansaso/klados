import { Button, Container, Flex, Heading, TextField } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PiFunnel, PiMagnifyingGlass } from "react-icons/pi";
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
      features,
      characters,
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
        features,
        characters,
      }),
    );
  },
  search: {
    middlewares: [
      stripSearchParams({
        status: DEFAULT_TAXON_STATUSES,
        features: [],
        characters: [],
      }),
    ],
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
      features: search.features,
      characters: search.characters,
    }),
  );

  const [filtersOpen, setFiltersOpen] = useState(false);
  // Debounced into search, and synced from search for external changes
  const [localQ, setLocalQ] = useState(search.q ?? "");
  const [debouncedInput, { cancel }] = useDebounce(localQ, 250);

  useEffect(() => {
    const next = search.q ?? "";

    // Cancel any pending to avoid stale updates
    cancel();

    // Avoid setting if unnecessary (i.e. identical)
    // eslint-disable-next-line @eslint-react/set-state-in-effect
    setLocalQ((prev) => (prev === next ? prev : next));
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
              value={localQ}
              onChange={(e) => setLocalQ(e.currentTarget.value)}
            >
              <TextField.Slot>
                <PiMagnifyingGlass size="16" />
              </TextField.Slot>
            </TextField.Root>
            <Button
              aria-expanded={filtersOpen}
              aria-controls="taxa-filters"
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <PiFunnel size="1rem" />
              Filter
            </Button>
          </Flex>
        </Flex>
      </Container>
      <ContentContainer align="start" gray>
        <div
          className="taxa-filters"
          id="taxa-filters"
          data-open={filtersOpen}
          aria-hidden={!filtersOpen}
        >
          <div>
            <TaxonFilters search={search} setSearch={setSearch} />
          </div>
        </div>
        <TaxonGrid results={paginatedResult} />
      </ContentContainer>
    </>
  );
}
