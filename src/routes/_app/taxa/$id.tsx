import { createFileRoute } from "@tanstack/react-router";

type CommonName = { value: string; locale: string | null };
type SciName = { value: string };
type Taxon = {
  id: number;
  canonical: string;
  rank: string;
  commonNames: CommonName[];
  scientificNames: SciName[];
};

export const Route = createFileRoute("/_app/taxa/$id")({
  loader: async ({ params }) => {
    const res = await fetch(`/api/taxa/${params.id}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Not found");
    return (await res.json()) as Taxon;
  },
  component: TaxonPage,
});

function TaxonPage() {
  const t = Route.useLoaderData() as Taxon;
  return (
    <div style={{ padding: 16 }}>
      <h1>
        {t.canonical} <small>({t.rank})</small>
      </h1>

      {t.commonNames?.length ? (
        <>
          <h2>Common names</h2>
          <ul>
            {t.commonNames.map((n, i) => (
              <li key={i}>
                {n.value} {n.locale ? <small>({n.locale})</small> : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {t.scientificNames?.length ? (
        <>
          <h2>Other scientific names</h2>
          <ul>
            {t.scientificNames.map((n, i) => (
              <li key={i}>{n.value}</li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
