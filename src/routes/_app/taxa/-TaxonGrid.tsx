import { Grid, Text } from "@radix-ui/themes";
import { TaxonPaginatedResult } from "../../../lib/api/taxa/types";
import { TaxonCard } from "./-TaxonCard";

export const TaxonGrid = ({ results }: { results: TaxonPaginatedResult }) => {
  if (!results.items.length) return <Text>No taxa found.</Text>;
  return (
    <Grid columns={{ initial: "3", md: "5" }} gap="4" className="taxon-grid">
      {results.items.map((t) => (
        <TaxonCard key={t.id} taxon={t} />
      ))}
    </Grid>
  );
};
