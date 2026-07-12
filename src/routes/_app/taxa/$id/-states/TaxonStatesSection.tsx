import { Box } from "@radix-ui/themes";
import type { FeatureStateDTO } from "../../../../../lib/domain/states/types";
import { FeatureRenderer } from "./FeatureRenderer";

export const TaxonStateSection = ({
  groups,
}: {
  groups: FeatureStateDTO[];
}) => {
  return (
    groups.length > 0 && (
      <Box>
        {groups.map((group) => (
          <FeatureRenderer key={group.featureId} feature={group} />
        ))}
      </Box>
    )
  );
};
