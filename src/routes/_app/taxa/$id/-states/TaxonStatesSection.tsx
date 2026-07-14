import { Box } from "@radix-ui/themes";
import type { FeatureStateDTO } from "../../../../../lib/domain/states/types";
import { FeatureRenderer } from "./FeatureRenderer";

export const TaxonStateSection = ({
  groups,
  indentDescription,
}: {
  groups: FeatureStateDTO[];
  indentDescription?: boolean;
}) => {
  const sortedGroups = [...groups].sort((left, right) =>
    left.featureLabel.localeCompare(right.featureLabel),
  );

  return (
    groups.length > 0 && (
      <Box>
        {sortedGroups.map((group) => (
          <FeatureRenderer
            key={group.featureId}
            feature={group}
            indentDescription={indentDescription}
          />
        ))}
      </Box>
    )
  );
};
