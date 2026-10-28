import { Badge, Box, Table, Text, type BadgeProps } from "@radix-ui/themes";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { TaxonEditKind } from "../../../../db/schema/schema";
import { PaginationFooter } from "../../../components/PaginationFooter";
import { RouterRadixLink } from "../../../components/RouterRadixLink";
import { TaxonName } from "../../../components/TaxonName";
import type {
  TaxonEditArea,
  TaxonEditLogDTO,
} from "../../../lib/domain/taxon-edits/types";
import { useRoutedPaginatedSearch } from "../../../lib/hooks/useRoutedPaginatedSearch";
import { taxonEditsAdminQueryOptions } from "../../../lib/queries/taxonEdits";
import { capitalizeFirstLetter } from "../../../lib/utils/formatting/casing";
import { taxonParams } from "../../../lib/utils/formatting/taxonUrl";
import { SearchSchema } from "../../../lib/validation/search";

const AREA_LABELS: Record<TaxonEditArea, string> = {
  names: "Names",
  taxonomy: "Taxonomy",
  externalIds: "External IDs",
  morphology: "Morphology",
  media: "Media",
  sources: "Sources",
  ecology: "Ecology",
  notes: "Notes",
};

const KIND_COLORS: Record<TaxonEditKind, BadgeProps["color"]> = {
  archived: "tomato",
  created: "grass",
  edited: "amber",
  published: "cyan",
};

export const Route = createFileRoute("/admin/taxon-edits/")({
  validateSearch: SearchSchema,
  loaderDeps: ({ search: { page, pageSize } }) => ({ page, pageSize }),
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(
      taxonEditsAdminQueryOptions(deps.page, deps.pageSize),
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { page, pageSize } = Route.useSearch();
  const { next, prev } = useRoutedPaginatedSearch();
  const { data } = useSuspenseQuery(
    taxonEditsAdminQueryOptions(page, pageSize),
  );

  return (
    <Box>
      <Table.Root size="1">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Taxon</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>User</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Kind</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Areas</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data.items.map((edit) => (
            <Table.Row key={edit.id}>
              <Table.Cell>
                {new Date(edit.createdAt).toLocaleString()}
              </Table.Cell>
              <Table.Cell>
                <RouterRadixLink
                  to="/taxa/$id"
                  params={taxonParams(edit.taxon)}
                >
                  <TaxonName
                    rank={edit.taxon.rank}
                    name={edit.taxon.acceptedName}
                  />
                </RouterRadixLink>
              </Table.Cell>
              <Table.Cell>
                {edit.user ? (
                  <RouterRadixLink
                    to="/users/$username"
                    params={{ username: edit.user.username }}
                  >
                    {edit.user.username}
                  </RouterRadixLink>
                ) : (
                  <Text color="gray">[deleted]</Text>
                )}
              </Table.Cell>
              <Table.Cell>
                <Badge color={KIND_COLORS[edit.kind]}>
                  {capitalizeFirstLetter(edit.kind)}
                </Badge>
              </Table.Cell>
              <Table.Cell>{formatAreas(edit)}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      <Box px="3" pb="3">
        <PaginationFooter
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          onPrev={prev}
          onNext={() => next(data.total)}
        />
      </Box>
    </Box>
  );
}

function formatAreas(edit: TaxonEditLogDTO): string {
  return (Object.keys(AREA_LABELS) as TaxonEditArea[])
    .filter((area) => edit[area])
    .map((area) => AREA_LABELS[area])
    .join(", ");
}
