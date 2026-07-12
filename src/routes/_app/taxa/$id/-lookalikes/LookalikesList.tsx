import NiceModal from "@ebay/nice-modal-react";
import { Box, Button, Flex, Grid } from "@radix-ui/themes";
import { PiSubtractSquare } from "react-icons/pi";
import { LookalikeDialog } from "../../../../../components/dialogs/LookalikeDialog";
import { LookalikePercentBadge } from "../../../../../components/LookalikeBadge";
import { TaxonCard } from "../../../../../components/TaxonCard";
import type { TaxonLookalikeDTO } from "../../../../../lib/domain/lookalikes/types";

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
      columns={{ initial: "2", xs: "3", md: "5" }}
      gap="4"
      className="taxon-grid lookalikes-list"
    >
      {lookalikes.map((l) => (
        <Flex key={l.id} direction="column" className="lookalikes-entry">
          <TaxonCard
            id={l.id}
            rank={l.rank}
            acceptedName={l.acceptedName}
            preferredCommonName={l.preferredCommonName}
            thumbnail={l.media[0]}
            serveAsLink
            size="1"
            inset
          >
            <Box position="absolute" top="2" right="2">
              <LookalikePercentBadge percentage={l.jaccard} />
            </Box>
          </TaxonCard>
          <Button
            size="1"
            variant="outline"
            onClick={() =>
              NiceModal.show(LookalikeDialog, {
                taxonId,
                lookalikeId: l.id,
              })
            }
          >
            <PiSubtractSquare />
            Compare
          </Button>
        </Flex>
      ))}
    </Grid>
  );
};
