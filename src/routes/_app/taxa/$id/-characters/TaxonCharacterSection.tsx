import { Box, Text } from "@radix-ui/themes";
import { TaxonCharacterDisplayGroupDTO } from "../../../../../lib/domain/character-states/types";
import { GroupCard } from "./GroupCard";

export const TaxonCharacterSection = ({
  groups,
}: {
  groups: TaxonCharacterDisplayGroupDTO[];
}) => {
  return (
    <Box>
      {groups.length ? (
        <div className="editor-card-grid">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      ) : (
        <Text>No morphological data available for this taxon.</Text>
      )}
    </Box>
  );
};
