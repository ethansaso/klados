import { Grid, Text } from "@radix-ui/themes";
import { TaxonCard } from "../../../../components/TaxonCard";
import { type TaxonDTO } from "../../../../lib/domain/taxa/types";

export const TaxonGrid = ({ taxa }: { taxa: TaxonDTO[] }) => {
  if (!taxa.length) return <Text>No taxa found.</Text>;
  return (
    <Grid
      columns={{ initial: "3", sm: "4", md: "5" }}
      gap={{ initial: "1", sm: "2", md: "4" }}
      className="taxon-grid"
    >
      {taxa.map((t) => (
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
