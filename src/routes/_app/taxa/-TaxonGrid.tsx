import { Flex, Grid, Text } from "@radix-ui/themes";
import { PiTreeStructure } from "react-icons/pi";
import { TaxonCard } from "../../../components/TaxonCard";
import { TaxonPaginatedResult } from "../../../lib/domain/taxa/types";

export const TaxonGrid = ({ results }: { results: TaxonPaginatedResult }) => {
  if (!results.items.length) return <Text>No taxa found.</Text>;
  return (
    <Grid columns={{ initial: "3", md: "5" }} gap="4" className="taxon-grid">
      {results.items.map((t) => (
        <TaxonCard
          key={t.id}
          id={t.id}
          rank={t.rank}
          acceptedName={t.acceptedName}
          preferredCommonName={t.preferredCommonName}
          thumbnail={t.media[0]}
          serveAsLink
        >
          <Flex mt="1" align="center" gap="1" className="summary" asChild>
            <Text as="div" size="1" color="gray">
              <PiTreeStructure />
              {t.activeChildCount}{" "}
              {t.activeChildCount === 1 ? "subtaxon" : "subtaxa"}
            </Text>
          </Flex>
        </TaxonCard>
      ))}
    </Grid>
  );
};
