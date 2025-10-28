import { Box, Text } from "@radix-ui/themes";
import { useCharacterStore } from "./-useCharacterEditingStore";

export const CharacterEditingForm = () => {
  const characters = useCharacterStore((s) => s.draft);

  return (
    <Box>
      {characters.map((c) => (
        <Text>character</Text>
      ))}
    </Box>
  );
};
