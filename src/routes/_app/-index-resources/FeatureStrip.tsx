import "./FeatureStrip.css";

import { Box, Flex, Heading, Text } from "@radix-ui/themes";
import {
  PiBrowsers,
  PiGlobeHemisphereWest,
  PiNewspaperClipping,
  PiNotePencil,
  PiTreeStructure,
} from "react-icons/pi";
import { RouterRadixLink } from "../../../components/RouterRadixLink";

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
    extras: (
      <RouterRadixLink to="/curators/new" size="1" highContrast mt="1">
        (apply to be a curator!)
      </RouterRadixLink>
    ),
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
          {CAPABILITIES.map(({ icon: Icon, verb, object, extras }) => (
            <li key={verb}>
              <Icon className="feature-strip__icon" aria-hidden size="5rem" />
              <Heading as="h3" size="4" mb="1">
                {verb}
              </Heading>
              <Text as="p" size="2" color="gray">
                {object}
              </Text>
              {extras && extras}
            </li>
          ))}
        </ul>
      </Box>
    </Flex>
  );
};
