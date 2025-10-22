import { Grid, Text } from "@radix-ui/themes";
import { TaxonPageResult } from "../../../lib/serverFns/taxa";
import { TaxonCard } from "./-TaxonCard";

export const TaxonGrid = ({ results }: { results: TaxonPageResult }) => {
  if (!results.items.length) return <Text>No taxa found.</Text>;
  return (
    <Grid columns={{ initial: "3", md: "5" }} gap="4">
      {results.items.map((t) => (
        <TaxonCard key={t.id} taxon={t} />
      ))}
    </Grid>
  );
};
