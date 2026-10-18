import { Box } from "@radix-ui/themes";
import type { FeatureStateDTO } from "../../../../../lib/domain/states/types";
import type { TaxonSourceDTO } from "../../../../../lib/domain/taxon-sources/types";
import type { NumberedFeatureCitation } from "../edit/-sources/citableSources";
import { FeatureRenderer } from "./FeatureRenderer";

export const TaxonStateSection = ({
  groups,
  sources,
  indentDescription,
}: {
  groups: FeatureStateDTO[];
  /** In display order, which sets the footnote numbers. */
  sources: TaxonSourceDTO[];
  indentDescription?: boolean;
}) => {
  const citations = new Map<number, NumberedFeatureCitation>(
    sources.map((source, i) => [source.sourceId, { number: i + 1, source }]),
  );
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
            citations={citations}
            indentDescription={indentDescription}
          />
        ))}
      </Box>
    )
  );
};
