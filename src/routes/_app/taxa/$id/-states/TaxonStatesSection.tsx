import { Box, Heading, Text } from "@radix-ui/themes";
import type { FeatureStateDTO } from "../../../../../lib/domain/states/types";
import { FeatureCard } from "./FeatureCard";

export const TaxonStateSection = ({
  groups,
}: {
  groups: FeatureStateDTO[];
}) => {
  return (
    <Box>
      <Box mb="4">
        <Heading size={{ initial: "3", sm: "4" }} mb="1">
          Morphological Description
        </Heading>
        {groups.length ? (
          <Text as="p" size={{ initial: "2", sm: "3" }}>
            Some traits may have additional information from the glossary,
            indicated by an underline. Hover over these terms to view these
            definitions.
          </Text>
        ) : (
          <Text size={{ initial: "2", sm: "3" }}>
            No morphological data available for this taxon.
          </Text>
        )}
      </Box>
      {groups.length > 0 && (
        <div className="feature-card-grid">
          {groups.map((group) => (
            <FeatureCard key={group.featureId} feature={group} />
          ))}
        </div>
      )}
    </Box>
  );
};
