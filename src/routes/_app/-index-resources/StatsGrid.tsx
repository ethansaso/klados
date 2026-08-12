import { Box, Flex, Heading, Text } from "@radix-ui/themes";
import { PiDna, PiTreeStructure, PiUsersThree } from "react-icons/pi";
import { type SummaryStatsDTO } from "../../../lib/domain/stats/types";
import "./StatsGrid.css";

interface StatsFeatureGridProps {
  summaryStats: SummaryStatsDTO;
}

export const StatsFeatureGrid = ({ summaryStats }: StatsFeatureGridProps) => {
  const stats = [
    {
      icon: PiDna,
      count: summaryStats.taxaCount,
      label: "Taxa in database",
    },
    {
      icon: PiUsersThree,
      count: summaryStats.memberCount,
      label: "Community members",
    },
    {
      icon: PiTreeStructure,
      count: summaryStats.guidesCount,
      label: "Guides published",
    },
  ];

  return (
    <Flex direction="column" align="center" py="8" px="6" width="100%">
      <Box className="stats-grid">
        {stats.map(({ icon: Icon, count, label }) => (
          <Box className="stats-grid__item" key={label}>
            <Box className="stats-icon__container">
              <Icon className="stats-icon" />
            </Box>
            <Heading as="h3" size="7">
              {count.toLocaleString()}
            </Heading>
            <Text size="4">{label}</Text>
          </Box>
        ))}
      </Box>
    </Flex>
  );
};
