import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { taxaQueryOptions } from "../../../lib/queries/taxa";
import { TaxonCard } from "./-TaxonCard";

type Item = { id: number; canonical: string; rank: string; updatedAt: string };

export const Route = createFileRoute("/_app/taxa/")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(taxaQueryOptions(1, 20));
  },
  component: TaxaList,
});

function TaxaList() {
  const { data: paginatedResult } = useSuspenseQuery(taxaQueryOptions(1, 20));

  if (!paginatedResult.items.length) return <p>No taxa yet.</p>;
  return (
    <div style={{ padding: 16 }}>
      <h1>Taxa</h1>
      <ul>
        {paginatedResult.items.map((t) => (
          <TaxonCard key={t.id} taxon={t} />
        ))}
      </ul>
    </div>
  );
}
