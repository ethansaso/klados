import "./SpeciesDescription.css";

import {
  Box,
  Card,
  Container,
  Em,
  Flex,
  Heading,
  Strong,
  Text,
} from "@radix-ui/themes";
import { Fragment, type ReactNode } from "react";
import { AnnotationBubbleWrap } from "../../../components/annotations/AnnotationBubbleWrap";
import { GlossaryCard } from "../../../components/glossary-cards/GlossaryCard";
import { ColorBubble } from "../../../components/state-formatting/helpers/ColorBubble";
import { capitalizeFirstLetter } from "../../../lib/utils/formatting/casing";

type State = {
  prefix?: string;
  label: string;
  suffix?: string;
  hex?: string;
  info?: string;
};

type Character = { label?: string; states: State[] };

type Feature = { label: string; info?: string; characters: Character[] };

const DESCRIPTION: Feature[] = [
  {
    label: "Cap",
    characters: [
      {
        states: [
          { hex: "#ffbb99", label: "salmon" },
          { hex: "#ffcc99", label: "light orange" },
          { hex: "#ffe699", label: "buff", suffix: "at margin" },
        ],
      },
      {
        states: [
          { label: "ovate", info: "Egg-shaped." },
          { prefix: "becoming", label: "convex", suffix: "in age" },
        ],
      },
      {
        states: [
          { label: "striate", info: "Having stripes or grooves" },
          { prefix: "conspicuously", label: "grooved" },
        ],
      },
      {
        states: [
          { label: "viscid", suffix: "when moist" },
          { label: "smooth" },
        ],
      },
      { label: "diameter", states: [{ label: "5–11 cm" }] },
    ],
  },
  {
    label: "Gills",
    characters: [
      { states: [{ label: "close" }] },
      {
        states: [
          { hex: "#FFFFFF", label: "white" },
          {
            prefix: "sometimes",
            hex: "#f0c2c2",
            label: "pinkish",
            suffix: "in age",
          },
        ],
      },
      {
        states: [
          { label: "free" },
          {
            prefix: "slightly",
            label: "adnate",
            info: "Broadly attached to the stipe.",
          },
          {
            prefix: "sometimes",
            label: "adnexed",
            info: "Reaching to stipe, but not attached.",
          },
        ],
      },
    ],
  },
  {
    label: "Stipe",
    info: "Technical term for stem.",
    characters: [
      { states: [{ hex: "#FFFFFF", label: "white" }] },
      { states: [{ label: "bulbous", suffix: "at base" }] },
      {
        states: [
          { label: "smooth" },
          { prefix: "sometimes", label: "scaly", suffix: "below" },
          { label: "pruinose", info: "Covered in a dusty bloom." },
        ],
      },
      { label: "length", states: [{ label: "4–11 cm" }] },
      { label: "diameter", states: [{ label: "1–2.5 cm" }] },
    ],
  },
  {
    label: "Volva",
    info: "A saclike membrane at the base of the stipe remaining after a mushroom emerges from a universal veil.",
    characters: [
      { states: [{ label: "membranous" }] },
      { states: [{ hex: "#FFFFFF", label: "white" }] },
      { states: [{ label: "cup-like" }] },
    ],
  },
];

const Term = ({ label, info }: { label: string; info?: string }) =>
  info ? (
    <GlossaryCard
      info={{
        title: capitalizeFirstLetter(label),
        description: info,
        media: null,
      }}
    >
      <span className="has-information">{label}</span>
    </GlossaryCard>
  ) : (
    <>{label}</>
  );

const joinNodes = (nodes: ReactNode[], separator: string) =>
  nodes.map((node, index) => (
    <Fragment key={index}>
      {index > 0 && separator}
      {node}
    </Fragment>
  ));

const StateText = ({ prefix, suffix, hex, ...term }: State) => (
  <>
    {prefix && `${prefix} `}
    <span className="species-demo__state">
      {hex && (
        <span className="species-demo__swatch">
          <ColorBubble size={8} hexColor={hex} />
        </span>
      )}
      <Term {...term} />
    </span>
    {suffix && ` ${suffix}`}
  </>
);

const CharacterText = ({ label, states }: Character) => (
  <>
    {label && `${label} `}
    {joinNodes(
      states.map((state) => <StateText key={state.label} {...state} />),
      ", ",
    )}
  </>
);

const FeatureText = ({ label, info, characters }: Feature) => (
  <>
    <Strong>
      <Term label={label} info={info} />
    </Strong>{" "}
    {joinNodes(
      characters.map((character) => (
        <CharacterText
          key={character.label ?? character.states[0]!.label}
          {...character}
        />
      )),
      "; ",
    )}
    {". "}
  </>
);

export const SpeciesDescription = () => (
  <Box width="100%" px="6">
    <Container pt="8" pb="7" size={{ sm: "2", md: "3" }} width="100%">
      <Flex direction="column" align="center" mb="6">
        <Heading as="h2" size={{ initial: "7", sm: "8" }} align="center">
          Descriptions that teach themselves
        </Heading>
        <Text as="p" size="4" align="center" mt="4" style={{ maxWidth: 560 }}>
          Using a curated vocabulary, Klados renders{" "}
          <GlossaryCard
            info={{
              title: "Machine-readable",
              description:
                "Data in a format that can be processed by computers for operations like sorting, filtering, and comparison.",
              media: null,
            }}
          >
            <span className="has-information">machine-readable</span>
          </GlossaryCard>{" "}
          data as rich prose, and explains the technical terms in place.
        </Text>
      </Flex>

      <Box className="species-demo">
        <Card size="3">
          <Box className="species-demo__body">
            <Box className="species-demo__figure">
              <AnnotationBubbleWrap
                media={{
                  owner: "Christian Schwarz",
                  license: "cc-by-nc",
                  source: "https://www.inaturalist.org/photos/14405698",
                }}
                spacing="2"
              >
                <img src="/demo-img/avelosa.jpg" alt="Amanita velosa" />
              </AnnotationBubbleWrap>
            </Box>

            <Box minWidth="0">
              <Box mb="2">
                <Text as="p" size="2">
                  <Strong>Springtime Amanita</Strong>
                </Text>
                <Text as="p" size="2" color="gray">
                  <Em>Amanita velosa</Em>
                </Text>
              </Box>
              <Text as="p" size="2">
                {DESCRIPTION.map((feature) => (
                  <FeatureText key={feature.label} {...feature} />
                ))}
              </Text>
            </Box>
          </Box>
        </Card>
      </Box>
    </Container>
  </Box>
);
