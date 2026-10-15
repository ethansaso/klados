import "./FeatureStrip.css";

import { Box, Flex, Heading, Text } from "@radix-ui/themes";
import {
  PiBrowsers,
  PiGlobeHemisphereWest,
  PiNewspaperClipping,
  PiNotePencil,
  PiTreeStructure,
} from "react-icons/pi";

const CAPABILITIES = [
  {
    icon: PiNewspaperClipping,
    verb: "Learn",
    object: "biodiversity through visual descriptions",
  },
  {
    icon: PiTreeStructure,
    verb: "Identify",
    object: "using visual, flowchart-style guides",
  },
  {
    icon: PiBrowsers,
    verb: "Compare",
    object: "species lookalikes side-by-side",
  },
  {
    icon: PiNotePencil,
    verb: "Author",
    object: "guides and descriptions",
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
      px={{ initial: "5", xs: "6" }}
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
              <Icon className="feature-strip__icon" aria-hidden />
              <Heading as="h3" size={{ initial: "4", sm: "5" }} mb="1">
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
