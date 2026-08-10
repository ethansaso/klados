import "./FeatureStrip.css";

import { Box, Flex, Heading, Text } from "@radix-ui/themes";
import {
  PiArticle,
  PiBrowsers,
  PiGlobeHemisphereWest,
  PiNotePencil,
  PiTreeStructure,
} from "react-icons/pi";

/** Each entry completes the sentence in the heading above the strip. */
const CAPABILITIES = [
  {
    icon: PiArticle,
    verb: "Learn",
    object: "diverse morphological descriptions",
  },
  {
    icon: PiBrowsers,
    verb: "Compare",
    object: "species lookalikes side-by-side",
  },
  {
    icon: PiTreeStructure,
    verb: "Identify",
    object: "using visual, flowchart-style guides",
  },
  {
    icon: PiNotePencil,
    verb: "Author",
    object: "guides and glossary entries",
  },
  {
    icon: PiGlobeHemisphereWest,
    verb: "Contribute",
    object: "to free, open science",
  },
];

export const FeatureStrip = () => {
  return (
    <Flex
      direction="column"
      align="center"
      py="7"
      px="6"
      width="100%"
      className="feature-strip"
    >
      <Heading as="h2" size={{ initial: "5", sm: "6" }} align="center" mb="6">
        Klados helps you:
      </Heading>
      <Box asChild>
        <ul className="feature-strip__list">
          {CAPABILITIES.map(({ icon: Icon, verb, object }) => (
            <li key={verb}>
              <Icon className="feature-strip__icon" aria-hidden size="4rem" />
              <Heading as="h3" size="4" mb="1">
                {verb}
              </Heading>
              <Text as="p" size="2" color="gray">
                {object}
              </Text>
            </li>
          ))}
        </ul>
      </Box>
    </Flex>
  );
};
