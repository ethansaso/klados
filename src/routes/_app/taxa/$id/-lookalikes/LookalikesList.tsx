import NiceModal from "@ebay/nice-modal-react";
import { Box, Grid, Heading, Text } from "@radix-ui/themes";
import { LookalikePercentBadge } from "../../../../../components/LookalikeBadge";
import { TaxonCard } from "../../../../../components/TaxonCard";
import type { TaxonLookalikeDTO } from "../../../../../lib/domain/lookalikes/types";
import { LookalikeModal } from "./LookalikeModal";

interface LookalikesListProps {
  taxonId: number;
  taxonAcceptedName: string;
  lookalikes: TaxonLookalikeDTO[];
}

// TODO: consider confidence differential heuristic for when % matched and Jaccard diverge greatly
export const LookalikesList = ({
  taxonId,
  taxonAcceptedName,
  lookalikes,
}: LookalikesListProps) => {
  return (
    <Box>
      <Box>
        <Heading size={{ initial: "3", sm: "4" }} mb="1">
          Similar Taxa
        </Heading>
        {lookalikes.length ? (
          <Text as="p" color="gray" size={{ initial: "1", sm: "2" }} mb="4">
            These taxa share similar characteristics with {taxonAcceptedName}.
            Click on any taxon to compare side-by-side.
          </Text>
        ) : (
          <Text size={{ initial: "2", sm: "3" }}>
            We couldn't determine any lookalikes for this taxon.
          </Text>
        )}
      </Box>
      <Grid
        columns={{ initial: "2", xs: "3", md: "5" }}
        gap="4"
        className="taxon-grid"
      >
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
                lookalikeId: l.id,
              })
            }
          >
            <Box position="absolute" top="4" right="4">
              <LookalikePercentBadge percentage={l.jaccard} />
            </Box>
          </TaxonCard>
        ))}
      </Grid>
    </Box>
  );
};
