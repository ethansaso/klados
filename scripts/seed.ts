import "dotenv/config";
import { db, pool } from "../src/db/client";
import { taxa, names } from "../src/db/schema/schema";
import { and, eq } from "drizzle-orm";

async function getOrCreateTaxon(canonical: string, rank: typeof taxa.$inferInsert.rank, parentId: number | null) {
  const existing = await db
    .select({ id: taxa.id })
    .from(taxa)
    .where(and(eq(taxa.canonical, canonical), eq(taxa.rank, rank)))
    .limit(1);

  if (existing[0]) return existing[0].id;

  const [row] = await db
    .insert(taxa)
    .values({ canonical, rank, parentId })
    .returning({ id: taxa.id });

  return row.id;
}

async function ensureName(taxonId: number, kind: "common" | "scientific", value: string, locale?: string | null) {
  const existing = await db
    .select({ id: names.id })
    .from(names)
    .where(
      and(
        eq(names.taxonId, taxonId),
        eq(names.kind, kind),
        eq(names.value, value),
        // locale can be NULL; Drizzle's eq(null) is ok if column is null
        locale ? eq(names.locale, locale) : eq(names.locale, null as any)
      )
    )
    .limit(1);

  if (existing[0]) return existing[0].id;

  const [row] = await db
    .insert(names)
    .values({ taxonId, kind, value, locale: locale ?? null })
    .returning({ id: names.id });

  return row.id;
}

async function main() {
  // Genus: Agaricus
  const genusId = await getOrCreateTaxon("Agaricus", "genus", null);

  // Species: Agaricus bisporus (child of Agaricus)
  const speciesId = await getOrCreateTaxon("Agaricus bisporus", "species", genusId);

  // Common names
  await ensureName(speciesId, "common", "button mushroom", "en");
  await ensureName(speciesId, "common", "portobello", "en");

  // Additional scientific name (historical/alternate)
  await ensureName(speciesId, "scientific", "Psalliota bispora");
}

main()
  .then(() => console.log("Seed complete"))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
