import { Box, Flex, Grid, Heading, Text } from "@radix-ui/themes";
import {
  PiBookOpenUser,
  PiBrain,
  PiBrowsers,
  PiGraphFill,
} from "react-icons/pi";

export const PurposeSection = () => {
  return (
    <Flex direction="column" align="center" py="8" className="purpose-section">
      <Heading mb="5" size="8">
        How Klados Helps You Learn
      </Heading>
      <Grid columns="2" gapX="6" gapY="6" width="1000px" asChild>
        <ul className="purpose-list">
          <li>
            <PiBookOpenUser />
            <Box>
              <Heading size="5" mb="2">
                Browse Species
              </Heading>
              <Text size="4">
                Explore diverse species with rich images, descriptions, and
                morphological data.
              </Text>
            </Box>
          </li>
          <li>
            <PiGraphFill />
            <Box>
              <Heading size="5" mb="2">
                Follow Visual Guides
              </Heading>
              <Text size="4">
                Use interactive, flowchart-style guides to identify organisms
                based on their traits.
              </Text>
            </Box>
          </li>
          <li>
            <PiBrowsers />
            <Box>
              <Heading size="5" mb="2">
                Compare Lookalikes
              </Heading>
              <Text size="4">
                Visualize side-by-side comparisons of similar species to spot
                distinguishing features.
              </Text>
            </Box>
          </li>
          <li>
            <PiBrain />
            <Box>
              <Heading size="5" mb="2">
                Contribute to Biodiversity Knowledge
              </Heading>
              <Text size="4">
                Know a group of species well? Make a guide and share your
                expertise with the community.
              </Text>
            </Box>
          </li>
        </ul>
      </Grid>
    </Flex>
  );
};
