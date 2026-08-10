import { Box, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { AnnotatedSpeciesCard } from "./AnnotatedSpeciesCard";

export const DescriptionSection = () => {
  return (
    <Box width="100%" px="6">
      <Container
        pt="8"
        pb="7"
        size={{ sm: "2", md: "3", lg: "4" }}
        width="100%"
      >
        <Flex
          direction={{ initial: "column", sm: "row" }}
          width="100%"
          gap={{ initial: "6", sm: "9" }}
          align="center"
        >
          <Box maxWidth={{ sm: "380px" }}>
            <Heading as="h2" size={{ initial: "7", sm: "8" }} mb="4">
              Descriptions that teach themselves
            </Heading>
            <Text as="p" mb="3" size="4">
              Klados' descriptions are backed by a rich glossary of text and
              imagery.
            </Text>
            <Text as="p" size="4">
              This keeps technical jargon from becoming a barrier to education.
            </Text>
          </Box>

          <AnnotatedSpeciesCard framed />
        </Flex>
      </Container>
    </Box>
  );
};
