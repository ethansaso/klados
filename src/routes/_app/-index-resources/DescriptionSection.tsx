import {
  Box,
  Button,
  Card,
  Container,
  Em,
  Flex,
  Heading,
  Inset,
  Strong,
  Text,
} from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import { PiArrowRightBold } from "react-icons/pi";
import { GuideDemoCanvas } from "../../../components/react-flow-guides/demo/GuideDemoCanvas";

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
              Klados' descriptions draw from a rich glossary of images and
              descriptions
            </Text>
            <Text as="p" mb="5" size="4">
              TODO
            </Text>
          </Box>
          <Box>
            <Box maxWidth="256px">
              <Card size="1">
                <Inset clip="padding-box" side="top" pb="current">
                  <img
                    src="/demo-img/crosellus.jpg"
                    alt="Contumyces rosellus"
                    style={{
                      width: "100%",
                      display: "block",
                    }}
                  />
                </Inset>
                <Text as="p">
                  <Strong>Rosy Navel</Strong>
                </Text>
                <Text as="p" color="gray">
                  <Em>Contumyces rosellus</Em>
                </Text>
              </Card>
            </Box>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
};
