import { Box, Card, Em, Flex, Inset, Strong, Text } from "@radix-ui/themes";
import { DemoGlossaryTerm } from "./DemoGlossaryTerm";

/**
 * Leader lines are drawn against a fixed 640x300 design space (see home.css),
 * so the endpoints below are plain pixel coordinates in that space. Each
 * connector runs flat from its label to the card edge, then angles into the
 * photo toward the structure it names.
 */
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
    {children}.
  </Text>
);

interface Props {
  /** Wraps the figure in a bordered, tinted panel. */
  framed?: boolean;
}

export const AnnotatedSpeciesCard: React.FC<Props> = ({ framed }) => {
  return (
    <Flex
      direction="column"
      className={
        framed
          ? "description-demo__figure description-demo__figure--framed"
          : "description-demo__figure"
      }
    >
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

        <Box
          className="description-demo__annotations"
          style={{
            color: "white",
          }}
        >
          <Box className="description-demo__label description-demo__label--cap">
            <MorphologyLine feature="Cap">
              rosy,{" "}
              <DemoGlossaryTerm title="Sulcate" description="Grooved.">
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
  );
};
