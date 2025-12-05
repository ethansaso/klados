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
      <Heading mb="5" size="7">
        A Visual Platform for Exploring Biodiversity
      </Heading>
      <Grid columns="2" gapX="6" gapY="6" width="1000px" asChild>
        <ul className="purpose-list">
          <li>
            <PiBookOpenUser />
            <Box>
              <Heading size="5" mb="1">
                Browse Species
              </Heading>
              <Text>
                Explore thousands of species with rich images, descriptions, and
                morphological data.
              </Text>
            </Box>
          </li>
          <li>
            <PiGraphFill />
            <Box>
              <Heading size="5" mb="1">
                Learn to Identify Organisms
              </Heading>
              <Text>
                Use interactive, flowchart-style keys to identify organisms
                based on their traits.
              </Text>
            </Box>
          </li>
          <li>
            <PiBrowsers />
            <Box>
              <Heading size="5" mb="1">
                Compare Lookalikes
              </Heading>
              <Text>
                Visualize side-by-side comparisons of similar species to spot
                distinguishing features.
              </Text>
            </Box>
          </li>
          <li>
            <PiBrain />
            <Box>
              <Heading size="5" mb="1">
                Contribute to Biodiversity Knowledge
              </Heading>
              <Text>
                Know a group of species well? Make a key and share your
                expertise with the community.
              </Text>
            </Box>
          </li>
        </ul>
      </Grid>
    </Flex>
  );
};
