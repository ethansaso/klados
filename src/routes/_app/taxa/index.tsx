import {
  Box,
  Button,
  Flex,
  Heading,
  Separator,
  TextField,
} from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  stripSearchParams,
  useRouterState,
} from "@tanstack/react-router";
import { useState } from "react";
import { PiFunnel, PiMagnifyingGlass, PiMicroscope } from "react-icons/pi";
import { ContentContainer } from "../../../components/ContentContainer";
import { DebouncedTextField } from "../../../components/inputs/DebouncedTextField";
import { PaginationFooter } from "../../../components/PaginationFooter";
import {
  DEFAULT_TAXON_STATUSES,
  type TaxonSearchParams,
  TaxonSearchSchema,
} from "../../../lib/domain/taxa/search";
import { taxaQueryOptions } from "../../../lib/queries/taxa";
import { routeSeo } from "../../../lib/utils/head/routeSeo";
import { TaxonFilters } from "./-components/TaxonFilters";
import { TaxonGrid } from "./-components/TaxonGrid";
import {
  TaxonStateFilterChips,
  TaxonStateFilterPopover,
} from "./-components/TaxonStateFilter";
import { isDefaultTaxonListing } from "./-defaultListing";
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
      filters,
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
        filters,
        sort: isDefaultTaxonListing(deps) ? "completeness" : undefined,
      }),
    );
  },
  search: {
    middlewares: [
      stripSearchParams({
        status: DEFAULT_TAXON_STATUSES,
        filters: [],
      }),
    ],
  },
  head: ({ match }) =>
    routeSeo({
      title: "Taxa | Klados",
      description:
        "Browse taxa on Klados, with morphological descriptions, photos, similar taxa, and distribution maps.",
      canonicalUrl: match.pathname,
    }),
  component: TaxaListPage,
});

function TaxaListPage() {
  const { search, replaceSearch, goToPage } = useTaxonSearchControls();
  const {
    data: { items, page, pageSize, total },
  } = useSuspenseQuery(
    taxaQueryOptions(search.page, search.pageSize, {
      q: search.q,
      status: search.status,
      highRank: search.highRank,
      lowRank: search.lowRank,
      hasMedia: search.hasMedia,
      hasMorphology: search.hasMorphology,
      hasEcology: search.hasEcology,
      filters: search.filters,
      sort: isDefaultTaxonListing(search) ? "completeness" : undefined,
    }),
  );

  const [filtersOpen, setFiltersOpen] = useState(false);
  // The URL updates before loaders resolve, so our own writes echo back in
  // order; `search.q` can lag and would overwrite newer typing.
  const urlQ = useRouterState({ select: (s) => s.location.search.q ?? "" });

  // Widen tiles only for default display
  const featured = page === 1 && isDefaultTaxonListing(search);

  return (
    <ContentContainer align="stretch" gray>
      <Heading weight="bold" size={{ initial: "6", xs: "7" }} mb="4">
        Browse taxa
      </Heading>
      <Flex direction="column" gap="2" mb="5">
        {/* The bar draws the border; the field only spans the input, so its
            focus-on-click handling stays clear of the buttons and popover. */}
        <Flex className="taxa-search" align="center" gap="3">
          <DebouncedTextField
            className="taxa-search__field"
            size="3"
            placeholder="Search taxa"
            aria-label="Search taxa"
            id="taxa-search"
            initialValue={urlQ}
            onDebouncedChange={(q) => replaceSearch({ q: q || undefined })}
          >
            <TextField.Slot>
              <PiMagnifyingGlass size="16" />
            </TextField.Slot>
          </DebouncedTextField>
          <Separator orientation="vertical" size="2" />
          <Button
            size="2"
            variant="ghost"
            m="0"
            color="gray"
            highContrast
            aria-label="Filters"
            aria-expanded={filtersOpen}
            aria-controls="taxa-filters"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <PiFunnel size="1rem" />
            <Box as="span" display={{ initial: "none", xs: "inline" }}>
              Filters
            </Box>
          </Button>
          <TaxonStateFilterPopover
            selected={search.filters}
            onChange={(filters) => replaceSearch({ filters })}
          >
            <Button size="2">
              <PiMicroscope size="1rem" />
              Traits
            </Button>
          </TaxonStateFilterPopover>
        </Flex>
        <TaxonStateFilterChips
          selected={search.filters}
          onChange={(filters) => replaceSearch({ filters })}
        />
      </Flex>
      <div
        className="taxa-filters"
        id="taxa-filters"
        data-open={filtersOpen}
        aria-hidden={!filtersOpen}
      >
        <div>
          <TaxonFilters search={search} setSearch={replaceSearch} />
        </div>
      </div>
      <TaxonGrid taxa={items} featured={featured} />
      {total > 0 && (
        <Box width="100%">
          <PaginationFooter
            size="2"
            page={page}
            pageSize={pageSize}
            total={total}
            onPrev={() => goToPage(page - 1)}
            onNext={() => goToPage(page + 1)}
          />
        </Box>
      )}
    </ContentContainer>
  );
}
