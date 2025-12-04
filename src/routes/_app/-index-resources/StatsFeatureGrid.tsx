import { Box, Flex, Heading, Text } from "@radix-ui/themes";
import { PiDna, PiTreeStructure, PiUsersThree } from "react-icons/pi";
import { SummaryStatsDTO } from "../../../lib/domain/stats/types";

interface StatsFeatureGridProps {
  summaryStats: SummaryStatsDTO;
}

export const StatsFeatureGrid = ({ summaryStats }: StatsFeatureGridProps) => {
  return (
    <Flex direction="column" align="center" py="7">
      <Heading mb="3" size="7">
        Platform Statistics
      </Heading>
      <Box className="feature-grid">
        <Box className="feature-grid__item">
          <Box className="feature-icon__container">
            <PiDna className="feature-icon" />
          </Box>
          <Heading size="6">{summaryStats.taxaCount.toLocaleString()}</Heading>
          <Text>Taxa in Database</Text>
        </Box>
        <Box className="feature-grid__item">
          <Box className="feature-icon__container">
            <PiUsersThree className="feature-icon" />
          </Box>
          <Heading size="6">
            {summaryStats.memberCount.toLocaleString()}
          </Heading>
          <Text>Community Members</Text>
        </Box>
        <Box className="feature-grid__item">
          <Box className="feature-icon__container">
            <PiTreeStructure className="feature-icon" />
          </Box>
          <Heading size="6">{summaryStats.keysCount.toLocaleString()}</Heading>
          <Text>Keys Published</Text>
        </Box>
      </Box>
    </Flex>
  );
};
