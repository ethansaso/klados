import {
  Box,
  Card,
  Container,
  Em,
  Flex,
  Heading,
  Inset,
  Strong,
  Text,
} from "@radix-ui/themes";
import { DemoGlossaryTerm } from "./DemoGlossaryTerm";

/** Leader lines drawn against 640x300 design space */
const CONNECTORS = [
  { outer: "180,30 192,30", inner: "192,30 262,31", dot: [262, 31] },
  { outer: "460,64 448,64", inner: "448,64 385,37", dot: [385, 37] },
  { outer: "180,150 192,150", inner: "192,150 250,103", dot: [250, 103] },
] as const;

const MorphologyLine = ({
  feature,
  children,
}: {
  feature: React.ReactNode;
  children: React.ReactNode;
}) => (
  <Text as="p" size="2">
    <Strong>{feature} </Strong>
    {children}
  </Text>
);

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
              Klados' descriptions are backed by a rich glossary of text and
              imagery.
            </Text>
            <Text as="p" mb="5" size="4">
              This keeps technical jargon from becoming a barrier to education.
            </Text>
          </Box>

          <Box className="description-demo">
            <Box className="description-demo__card">
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

            <svg
              className="description-demo__lines"
              viewBox="0 0 640 300"
              width="640"
              height="300"
              aria-hidden="true"
              focusable="false"
            >
              {CONNECTORS.map(({ outer, inner, dot }) => (
                <g key={outer}>
                  <polyline
                    className="description-demo__lead--outer"
                    points={outer}
                  />
                  <polyline
                    className="description-demo__lead--inner"
                    points={inner}
                  />
                  <circle
                    className="description-demo__lead-dot"
                    cx={dot[0]}
                    cy={dot[1]}
                    r="2.5"
                  />
                </g>
              ))}
            </svg>

            <Box className="description-demo__annotations">
              <Box className="description-demo__label description-demo__label--cap">
                <MorphologyLine feature="Cap">
                  rosy,{" "}
                  <DemoGlossaryTerm
                    title="Sulcate"
                    description="Having long, narrow sulci (grooves)."
                  >
                    sulcate
                  </DemoGlossaryTerm>
                </MorphologyLine>
              </Box>

              <Box className="description-demo__label description-demo__label--gills">
                <MorphologyLine feature="Gills">
                  <DemoGlossaryTerm
                    title="Decurrent"
                    description="Running gradually down the stipe."
                  >
                    decurrent
                  </DemoGlossaryTerm>
                </MorphologyLine>
              </Box>

              <Box className="description-demo__label description-demo__label--stipe">
                <MorphologyLine
                  feature={
                    <DemoGlossaryTerm
                      title="Stipe"
                      description="Another term for 'stem'."
                    >
                      Stipe
                    </DemoGlossaryTerm>
                  }
                >
                  finely crystalline
                </MorphologyLine>
              </Box>
            </Box>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
};
