// src/routes/taxa/index.tsx
import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

type Item = { id: number; canonical: string; rank: string; updatedAt: string };

export const Route = createFileRoute("/taxa/")({
  loader: async () => {
    const res = await fetch(`/api/taxa?limit=50`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load taxa");
    const data = (await res.json()) as { items: Item[] };
    return data.items;
  },
  component: TaxaList,
});

function TaxaList() {
  const items = Route.useLoaderData() as Item[];
  if (!items.length) return <p>No taxa yet.</p>;
  return (
    <div style={{ padding: 16 }}>
      <h1>Taxa</h1>
      <ul>
        {items.map((t) => (
          <li key={t.id}>
            <Link to="/taxa/$id" params={{ id: String(t.id) }}>
              {t.canonical} <small>({t.rank})</small>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
