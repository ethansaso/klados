import { Box, Heading } from "@radix-ui/themes";
import { TaxonCharacterDisplayGroupDTO } from "../../../../../lib/domain/character-states/types";
import { GroupCard } from "./GroupCard";

export const TaxonCharacterSection = ({
  groups,
}: {
  groups: TaxonCharacterDisplayGroupDTO[];
}) => {
  if (!groups.length) {
    return null;
  }
  return (
    <Box>
      <Heading size="6" mb="2">
        Character States
      </Heading>
      <div className="editor-card-grid">
        {groups.map((group) => (
          <GroupCard key={group.id} group={group} />
        ))}
      </div>
    </Box>
  );
};
