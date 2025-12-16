import { Box, Heading, Text } from "@radix-ui/themes";
import { TaxonCharacterDisplayGroupDTO } from "../../../../../lib/domain/character-states/types";
import { GroupCard } from "./GroupCard";

export const TaxonCharacterSection = ({
  groups,
}: {
  groups: TaxonCharacterDisplayGroupDTO[];
}) => {
  return (
    <Box>
      <Box mb="3">
        <Heading size="4">Morphological Description</Heading>
        {groups.length ? (
          <Text as="p">
            Some traits may have additional information from the glossary,
            indicated by an underline. Hover over these terms to view these
            definitions.
          </Text>
        ) : (
          <Text>No morphological data available for this taxon.</Text>
        )}
      </Box>
      {groups.length > 0 && (
        <div className="editor-card-grid">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </Box>
  );
};
