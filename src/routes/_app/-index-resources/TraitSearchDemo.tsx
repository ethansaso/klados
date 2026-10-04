import "./TraitSearchDemo.css";

import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  IconButton,
  Slider,
  Text,
} from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { PiArrowCounterClockwise, PiArrowRightBold } from "react-icons/pi";
import { AnnotationBubbleWrap } from "../../../components/annotations/AnnotationBubbleWrap";
import { GlossaryCard } from "../../../components/glossary-cards/GlossaryCard";
import { ColorBubble } from "../../../components/state-formatting/helpers/ColorBubble";
import { TaxonName } from "../../../components/TaxonName";
import { formatCount, HomeSection } from "./HomeSection";
import {
  CAP_DIAMETER_BOUNDS,
  TRAIT_DEMO_SPECIES,
  TRAIT_GROUPS,
  type TraitDemoSpecies,
  type TraitGroup,
} from "./traitSearchData";

const DEFAULT_DIAMETER = 6;

// Every filter must hold, mirroring how the real search ANDs its filters.
const matches = (
  species: TraitDemoSpecies,
  active: string[],
  diameter: number | null,
) =>
  active.every((key) => species.traits.includes(key)) &&
  (diameter === null ||
    (species.capDiameter[0] <= diameter && diameter <= species.capDiameter[1]));

interface Props {
  taxaCount: number;
}

export const TraitSearchDemo = ({ taxaCount }: Props) => (
  <HomeSection tinted>
    <Flex
      direction={{ initial: "column", md: "row" }}
      gap={{ initial: "6", lg: "9" }}
      align={{ initial: "stretch", md: "center" }}
    >
      <Box maxWidth={{ md: "300px", lg: "352px" }} flexShrink="1">
        <Heading
          as="h2"
          size={{ initial: "7", sm: "8", md: "7", lg: "8" }}
          mb="4"
          wrap="balance"
        >
          Search what you see
        </Heading>
        <Text as="p" mb="3" size="4" wrap="pretty">
          Identification usually begins without a name.
        </Text>
        <Text as="p" mb="5" size="4" wrap="pretty">
          Klados lets you find species by the traits you can observe, like
          color, shape, and size.
        </Text>
        <Box width={{ initial: "100%", xs: "auto" }} asChild>
          <Button type="button" radius="full" size="3" asChild>
            <Link to="/taxa">
              Search {formatCount(taxaCount, "taxon", "taxa") || "taxa"}
              <PiArrowRightBold />
            </Link>
          </Button>
        </Box>
      </Box>
      <TraitSearchWidget />
    </Flex>
  </HomeSection>
);

const TraitSearchWidget = () => {
  const [active, setActive] = useState<string[]>([]);
  const [diameter, setDiameter] = useState<number | null>(null);

  const toggle = (key: string) =>
    setActive((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );

  const hasFilters = active.length > 0 || diameter !== null;

  return (
    <Card size="2" className="trait-demo">
      <Flex
        direction={{ initial: "column", sm: "row" }}
        gap={{ initial: "7", md: "5", lg: "7" }}
      >
        <Flex
          direction="column"
          gap="3"
          flexShrink="0"
          width={{ initial: "100%", sm: "180px", md: "160px", lg: "180px" }}
        >
          {TRAIT_GROUPS.map((group) => (
            <Box key={group.label}>
              <Text as="p" size="1" weight="bold" mb="1">
                <GroupLabel {...group} />
              </Text>
              <Flex gap="1" wrap="wrap">
                {group.toggles.map(({ key, label, hex }) => {
                  const on = active.includes(key);
                  return (
                    <Button
                      key={key}
                      type="button"
                      size="1"
                      radius="full"
                      variant={on ? "solid" : "surface"}
                      color={on ? undefined : "gray"}
                      aria-pressed={on}
                      onClick={() => toggle(key)}
                    >
                      {hex && <ColorBubble size={8} hexColor={hex} />}
                      {label}
                    </Button>
                  );
                })}
              </Flex>
            </Box>
          ))}

          <Box>
            <Flex justify="between" align="center" mb="2" height="20px">
              <Text as="p" size="1" weight="bold" id="trait-demo-diameter">
                Cap diameter
              </Text>
              <Flex align="center" gap="2">
                <Text size="1" color="gray">
                  {diameter === null ? "Any size" : `${diameter} cm`}
                </Text>
                {diameter !== null && (
                  <IconButton
                    type="button"
                    size="1"
                    variant="ghost"
                    color="gray"
                    aria-label="Reset cap diameter"
                    onClick={() => setDiameter(null)}
                  >
                    <PiArrowCounterClockwise />
                  </IconButton>
                )}
              </Flex>
            </Flex>
            <Slider
              size="1"
              min={CAP_DIAMETER_BOUNDS.min}
              max={CAP_DIAMETER_BOUNDS.max}
              value={[diameter ?? DEFAULT_DIAMETER]}
              onValueChange={([value]) => setDiameter(value ?? null)}
              color={diameter === null ? "gray" : undefined}
              aria-labelledby="trait-demo-diameter"
            />
          </Box>

          {/* Reserved in the side-by-side layout so clearing doesn't shift it. */}
          <Box height={{ initial: hasFilters ? "20px" : "0", sm: "20px" }}>
            {hasFilters && (
              <Button
                type="button"
                size="1"
                variant="ghost"
                color="gray"
                onClick={() => {
                  setActive([]);
                  setDiameter(null);
                }}
              >
                Clear all filters
              </Button>
            )}
          </Box>
        </Flex>

        <Box className="trait-demo__grid" flexGrow="1">
          {TRAIT_DEMO_SPECIES.map((species) => (
            <ResultTile
              key={species.sciName}
              species={species}
              match={matches(species, active, diameter)}
            />
          ))}
        </Box>
      </Flex>
    </Card>
  );
};

const GroupLabel = ({ label, term }: TraitGroup) => {
  if (!term) return label;

  const [before, after] = label.split(term.word);
  return (
    <>
      {before}
      <GlossaryCard
        info={{ title: term.word, description: term.description, media: null }}
      >
        <span className="has-information">{term.word}</span>
      </GlossaryCard>
      {after}
    </>
  );
};

const ResultTile = ({
  species: { sciName, commonName, photo },
  match,
}: {
  species: TraitDemoSpecies;
  match: boolean;
}) => (
  <Box className="trait-demo__result" data-match={match}>
    <AnnotationBubbleWrap
      media={{ ...photo, source: photo.source ?? "" }}
      spacing="1"
    >
      <img
        className="trait-demo__photo"
        src={photo.url}
        alt={sciName}
        loading="lazy"
      />
    </AnnotationBubbleWrap>
    <Text as="div" size="1" weight="bold" mt="1">
      {commonName}
    </Text>
    <Text as="div" size="1" color="gray">
      <TaxonName rank="species" name={sciName} />
    </Text>
  </Box>
);
