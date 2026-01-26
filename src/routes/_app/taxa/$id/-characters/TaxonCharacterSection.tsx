import { Box, Heading, Text } from "@radix-ui/themes";
import type { GroupedCharacterStates } from "../../../../../lib/domain/character-states/utils";
import { GroupCard } from "./GroupCard";

export const TaxonCharacterSection = ({
  groups,
}: {
  groups: GroupedCharacterStates[];
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
        <div className="character-group-card-grid">
          {groups.map((group) => (
            <GroupCard key={group.groupId} group={group} />
          ))}
        </div>
      )}
    </Box>
  );
};
