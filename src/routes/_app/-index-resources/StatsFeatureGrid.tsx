import { Box, Flex, Heading, Text } from "@radix-ui/themes";
import { PiDna, PiTreeStructure, PiUsersThree } from "react-icons/pi";
import { type SummaryStatsDTO } from "../../../lib/domain/stats/types";

interface StatsFeatureGridProps {
  summaryStats: SummaryStatsDTO;
}

export const StatsFeatureGrid = ({ summaryStats }: StatsFeatureGridProps) => {
  const stats = [
    {
      icon: PiDna,
      count: summaryStats.taxaCount,
      label: (n: number) =>
        n === 1 ? "Taxon in database" : "Taxa in database",
    },
    {
      icon: PiUsersThree,
      count: summaryStats.memberCount,
      label: (n: number) =>
        n === 1 ? "Community member" : "Community members",
    },
    {
      icon: PiTreeStructure,
      count: summaryStats.guidesCount,
      label: (n: number) => (n === 1 ? "Guide published" : "Guides published"),
    },
  ];

  return (
    <Flex direction="column" align="center" py="8" px="6" width="100%">
      <Heading as="h2" mb="5" size={{ initial: "7", sm: "8" }} align="center">
        Our community in numbers
      </Heading>
      <Box className="feature-grid">
        {stats.map(({ icon: Icon, count, label }) => (
          <Box className="feature-grid__item" key={label(count)}>
            <Box className="feature-icon__container">
              <Icon className="feature-icon" />
            </Box>
            <Heading as="h3" size="6">
              {count.toLocaleString()}
            </Heading>
            <Text>{label(count)}</Text>
          </Box>
        ))}
      </Box>
    </Flex>
  );
};
