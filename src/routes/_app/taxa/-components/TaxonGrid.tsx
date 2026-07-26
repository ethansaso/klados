import { Grid, Text } from "@radix-ui/themes";
import { TaxonCard } from "../../../../components/TaxonCard";
import { type TaxonPaginatedResult } from "../../../../lib/domain/taxa/types";

export const TaxonGrid = ({ results }: { results: TaxonPaginatedResult }) => {
  if (!results.items.length) return <Text>No taxa found.</Text>;
  return (
    <Grid
      columns={{ initial: "3", md: "5" }}
      gap={{ initial: "1", sm: "2", md: "4" }}
      className="taxon-grid"
    >
      {results.items.map((t) => (
        <TaxonCard
          key={t.id}
          id={t.id}
          rank={t.rank}
          acceptedName={t.acceptedName}
          preferredCommonName={t.preferredCommonName}
          thumbnail={t.media[0]}
          serveAsLink
        />
      ))}
    </Grid>
  );
};
