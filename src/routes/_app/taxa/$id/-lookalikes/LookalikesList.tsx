import NiceModal from "@ebay/nice-modal-react";
import { Box, Grid } from "@radix-ui/themes";
import { LookalikePercentBadge } from "../../../../../components/LookalikeBadge";
import { TaxonCard } from "../../../../../components/TaxonCard";
import type { TaxonLookalikeDTO } from "../../../../../lib/domain/lookalikes/types";
import { LookalikeModal } from "./LookalikeModal";

interface LookalikesListProps {
  taxonId: number;
  lookalikes: TaxonLookalikeDTO[];
}

// TODO: consider confidence differential heuristic for when % matched and Jaccard diverge greatly
export const LookalikesList = ({
  taxonId,
  lookalikes,
}: LookalikesListProps) => {
  return (
    <Grid
      columns={{ initial: "2", xs: "3", md: "4" }}
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
  );
};
