import { Box, Heading } from "@radix-ui/themes";
import { TaxonCharacterStateDTO } from "../../../../../lib/domain/character-states/types";
import { TraitToken } from "./TraitToken";

export const TaxonCharacterSection = ({
  characters,
}: {
  characters: TaxonCharacterStateDTO[];
}) => {
  return (
    <Box>
      <Heading size="3">Character States</Heading>
      {characters.map((char) =>
        char.traitValues.map((trait) => (
          <TraitToken key={trait.id} trait={trait} />
        ))
      )}
    </Box>
  );
};
