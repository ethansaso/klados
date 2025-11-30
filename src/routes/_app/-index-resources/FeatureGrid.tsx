import { Box, Heading, Text } from "@radix-ui/themes";
import { PiDna, PiTreeStructure, PiUsersThree } from "react-icons/pi";

export const FeatureGrid = () => {
  // TODO: actual data
  return (
    <Box className="feature-grid">
      <Box className="feature-grid__item">
        <Box className="feature-icon__container">
          <PiDna className="feature-icon" />
        </Box>
        <Heading size="6">1,234,567</Heading>
        <Text>Taxa in Database</Text>
      </Box>
      <Box className="feature-grid__item">
        <Box className="feature-icon__container">
          <PiUsersThree className="feature-icon" />
        </Box>
        <Heading size="6">456,678</Heading>
        <Text>Active Users</Text>
      </Box>
      <Box className="feature-grid__item">
        <Box className="feature-icon__container">
          <PiTreeStructure className="feature-icon" />
        </Box>
        <Heading size="6">1,234,567</Heading>
        <Text>Keys Published</Text>
      </Box>
    </Box>
  );
};
