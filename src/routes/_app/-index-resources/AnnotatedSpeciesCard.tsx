import { Box, Card, Em, Flex, Inset, Strong, Text } from "@radix-ui/themes";
import { GlossaryCard } from "../../../components/glossary-cards/GlossaryCard";

/**
 * Leader lines are drawn in a fixed design space (see home.css): 168px labels
 * either side of a 224px card with 16px gaps, 592px wide. The svg covers the
 * photo band (224 x 4/5), so the endpoints below are plain pixel coordinates
 * in it. Each connector runs flat from its label to the card edge, then angles
 * into the photo toward the structure it names.
 */
const LINES_WIDTH = 592;
const LINES_HEIGHT = 179;

const CONNECTORS = [
  { outer: "172,26 184,26", inner: "184,26 245,27", dot: [245, 27] },
  { outer: "420,56 408,56", inner: "408,56 353,32", dot: [353, 32] },
  { outer: "172,131 184,131", inner: "184,131 235,90", dot: [235, 90] },
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
          viewBox={`0 0 ${LINES_WIDTH} ${LINES_HEIGHT}`}
          width={LINES_WIDTH}
          height={LINES_HEIGHT}
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
          style={{
            color: "white",
          }}
        >
          <Box className="description-demo__label description-demo__label--cap">
            <MorphologyLine feature="Cap">
              rosy,{" "}
              <GlossaryCard
                info={{
                  title: "Sulcate",
                  description: "Grooved.",
                  media: null,
                }}
              >
                <span className="has-information">sulcate</span>
              </GlossaryCard>
            </MorphologyLine>
          </Box>

          <Box className="description-demo__label description-demo__label--gills">
            <MorphologyLine feature="Gills">
              <GlossaryCard
                info={{
                  title: "Decurrent",
                  description: "Running gradually down the stipe.",
                  media: null,
                }}
              >
                <span className="has-information">decurrent</span>
              </GlossaryCard>
            </MorphologyLine>
          </Box>

          <Box className="description-demo__label description-demo__label--stipe">
            <MorphologyLine
              feature={
                <GlossaryCard
                  info={{
                    title: "Stipe",
                    description: "Technical term for 'stem'.",
                    media: null,
                  }}
                >
                  <span className="has-information">Stipe</span>
                </GlossaryCard>
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
