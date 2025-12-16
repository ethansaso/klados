import NiceModal from "@ebay/nice-modal-react";
import { Box, Grid, Heading, Text } from "@radix-ui/themes";
import { LookalikePercentBadge } from "../../../../../components/LookalikeBadge";
import { TaxonCard } from "../../../../../components/TaxonCard";
import { TaxonLookalikeDTO } from "../../../../../lib/domain/lookalikes/types";
import { LookalikeModal } from "./LookalikeModal";

interface LookalikesListProps {
  taxonId: number;
  taxonAcceptedName: string;
  lookalikes: TaxonLookalikeDTO[];
}

export const LookalikesList = ({
  taxonId,
  taxonAcceptedName,
  lookalikes,
}: LookalikesListProps) => {
  return (
    <Box>
      <Box mb="3">
        <Heading size="4">Similar Taxa</Heading>
        {lookalikes.length ? (
          <Text as="p">
            These taxa share similar characteristics with {taxonAcceptedName}.
            Click on any taxon to compare side-by-side.
          </Text>
        ) : (
          <Text>We couldn't determine any lookalikes for this taxon.</Text>
        )}
      </Box>
      <Grid columns={{ initial: "3", md: "5" }} gap="4" className="taxon-grid">
        {lookalikes.map((l) => (
          <TaxonCard
            key={l.id}
            id={l.id}
            rank={l.rank}
            acceptedName={l.acceptedName}
            preferredCommonName={l.preferredCommonName}
            thumbnail={l.media[0]}
            onClick={() =>
              NiceModal.show(LookalikeModal, {
                taxonId,
                taxonAcceptedName,
                lookalikeId: l.id,
                lookalikeAcceptedName: l.acceptedName,
              })
            }
          >
            <Box position="absolute" top="4" right="4">
              <LookalikePercentBadge percentage={l.pctOfTargetMatched} />
            </Box>
          </TaxonCard>
        ))}
      </Grid>
    </Box>
  );
};
