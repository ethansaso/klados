import NiceModal, { useModal } from "@ebay/nice-modal-react";
import {
  AspectRatio,
  Box,
  Dialog,
  Flex,
  Grid,
  Heading,
  IconButton,
  Text,
} from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { PiX } from "react-icons/pi";
import type {
  LookalikeComparisonAnnotatedState,
  LookalikeComparisonCharacter,
  LookalikeComparisonDetailDTO,
  LookalikeComparisonPresence,
} from "../../lib/domain/lookalikes/types";
import type { TaxonDTO } from "../../lib/domain/taxa/types";
import { lookalikeDetailsQueryOptions } from "../../lib/queries/lookalikes";
import { getMediaUrl } from "../../lib/storage/getMediaUrl";
import { formatTaxonName } from "../../lib/utils/formatting/formatTaxonName";
import { TaxonName } from "../TaxonName";
import { GlossaryFeatureCard } from "../glossary-cards/GlossaryFeatureCard";
import { CharacterStateDisplay } from "../state-formatting/CharacterStateDisplay";
import type { UICharacterState } from "../state-formatting/types";
import "./LookalikeDialog.css";

const PLACEHOLDER_SRC = "/logos/LogoDotted.svg";

const PRESENCE_COPY: Record<LookalikeComparisonPresence, string> = {
  unstated: "\u2014",
  present: "present",
  variable: "sometimes present",
  absent: "absent",
};

/** Phones label each value by taxon; desktop lines values up under the photos. */
const GRID_COLUMNS = {
  initial: "fit-content(35%) minmax(0, 1fr)",
  sm: "140px repeat(2, minmax(0, 1fr))",
};

export const LookalikeDialog = NiceModal.create<{
  taxonId: number;
  lookalikeId: number;
}>(({ taxonId, lookalikeId }) => {
  const { visible, hide } = useModal();
  const { data, isLoading, isError } = useQuery(
    lookalikeDetailsQueryOptions(taxonId, lookalikeId),
  );

  const content = useMemo(() => {
    if (isError) return <Text color="tomato">Failed</Text>;
    if (isLoading) return <Text>Loading...</Text>;
    if (!data) return <Text>No data</Text>;

    return <ModalContent data={data} />;
  }, [data, isLoading, isError]);

  return (
    <Dialog.Root
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          hide();
        }
      }}
    >
      <Dialog.Content size={{ initial: "2", sm: "3" }}>
        {content}
        <Box position="absolute" top="3" right="3">
          <Dialog.Close>
            <IconButton
              size="2"
              radius="full"
              variant="surface"
              color="gray"
              highContrast
              aria-label="Close"
            >
              <PiX />
            </IconButton>
          </Dialog.Close>
        </Box>
      </Dialog.Content>
    </Dialog.Root>
  );
});

function ModalContent({ data }: { data: LookalikeComparisonDetailDTO }) {
  return (
    <Box>
      <Grid
        columns={{ initial: "2", sm: GRID_COLUMNS.sm }}
        gapX={{ initial: "3", sm: "4" }}
        mb="4"
      >
        <Box display={{ initial: "none", sm: "block" }} />
        <TaxonColumnHeader taxon={data.a} />
        <TaxonColumnHeader taxon={data.b} />
      </Grid>

      {data.groupedStates.map((annotatedGroup) => {
        const presenceDiffers =
          annotatedGroup.aPresence !== annotatedGroup.bPresence;

        return (
          <Grid
            key={annotatedGroup.groupId}
            columns={GRID_COLUMNS}
            gapX="4"
            gapY="2"
            py="3"
            align="start"
            className="lookalike-modal__row"
          >
            <Box gridColumn={{ initial: "1 / -1", sm: "auto" }}>
              <Heading as="h3" size={{ initial: "3", sm: "2" }}>
                {annotatedGroup.groupHasInfo ? (
                  <GlossaryFeatureCard id={annotatedGroup.groupId}>
                    <span className="has-information">
                      {annotatedGroup.groupLabel}
                    </span>
                  </GlossaryFeatureCard>
                ) : (
                  annotatedGroup.groupLabel
                )}
              </Heading>
            </Box>

            <TaxonRowLabel taxon={data.a} />
            <GroupDataList
              presence={annotatedGroup.aPresence}
              presenceDiffers={presenceDiffers}
              items={annotatedGroup.aCharacters}
              emphasizeAll={
                presenceDiffers ||
                !getMeaningfulCharacters(annotatedGroup.bCharacters)?.length
              }
            />

            <TaxonRowLabel taxon={data.b} />
            <GroupDataList
              presence={annotatedGroup.bPresence}
              presenceDiffers={presenceDiffers}
              items={annotatedGroup.bCharacters}
              emphasizeAll={
                presenceDiffers ||
                !getMeaningfulCharacters(annotatedGroup.aCharacters)?.length
              }
            />
          </Grid>
        );
      })}
    </Box>
  );
}

function TaxonColumnHeader({ taxon }: { taxon: TaxonDTO }) {
  return (
    <Box>
      <AspectRatio ratio={4 / 3}>
        <img
          className="lookalike-modal__photo"
          src={taxonImageSrc(taxon)}
          alt={formatTaxonName(taxon.rank, taxon.acceptedName)}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = PLACEHOLDER_SRC;
          }}
        />
      </AspectRatio>
      <Flex align="center" gap="2" mt="2">
        {/* Only display 'avatars' on phones */}
        <Box display={{ initial: "block", sm: "none" }}>
          <TaxonAvatar taxon={taxon} size={18} />
        </Box>
        <Heading as="h2" size={{ initial: "1", sm: "4" }}>
          <TaxonName rank={taxon.rank} name={taxon.acceptedName} />
        </Heading>
      </Flex>
    </Box>
  );
}

function TaxonRowLabel({ taxon }: { taxon: TaxonDTO }) {
  return (
    <Flex
      display={{ initial: "flex", sm: "none" }}
      align="center"
      gap="1"
      minWidth="0"
      // Center on value's first line
      height="20px"
    >
      <TaxonAvatar taxon={taxon} size={16} />
      <Text
        className="lookalike-modal__label-name"
        size="1"
        weight="bold"
        color="gray"
        truncate
      >
        <TaxonName
          rank={taxon.rank}
          name={taxon.acceptedName}
          abbreviateGenus
        />
      </Text>
    </Flex>
  );
}

function TaxonAvatar({ taxon, size }: { taxon: TaxonDTO; size: number }) {
  return (
    <img
      className="lookalike-modal__avatar"
      src={taxonImageSrc(taxon)}
      alt=""
      width={size}
      height={size}
    />
  );
}

function GroupDataList({
  items,
  presence,
  presenceDiffers,
  emphasizeAll = false,
}: {
  items: LookalikeComparisonCharacter[] | null;
  presence: LookalikeComparisonPresence;
  presenceDiffers: boolean;
  emphasizeAll?: boolean;
}) {
  const meaningfulItems = getMeaningfulCharacters(items) ?? [];

  // If no states, use copy fallback
  if (presence === "unstated" || meaningfulItems.length === 0)
    return (
      <Text
        as="p"
        size="2"
        className={`lookalike-modal__group-copy ${differenceClassname(presenceDiffers)}`}
      >
        {PRESENCE_COPY[presence]}
      </Text>
    );

  return (
    <Text as="p" size="2" className="lookalike-modal__group-copy">
      {presence === "variable" && (
        <span className={differenceClassname(emphasizeAll)}>
          when present,{" "}
        </span>
      )}
      {meaningfulItems.map((it, idx) => {
        const showCharacterLabel = it.showInProse;
        const isSharedCharacter =
          !emphasizeAll && it.states.every((state) => state.isOverlapping);

        return (
          <span
            key={it.characterId}
            className={differenceClassname(emphasizeAll || !isSharedCharacter)}
          >
            {showCharacterLabel && (
              <Text as="span">{it.characterLabel.toLowerCase()} </Text>
            )}
            {it.states.map((state, stateIdx) => (
              <span
                key={getAnnotatedStateKey(state)}
                className={differenceClassname(
                  emphasizeAll || !state.isOverlapping,
                )}
              >
                <CharacterStateDisplay
                  states={[toUIState(state)]}
                  forceLowercase
                />
                {stateIdx < it.states.length - 1 && ", "}
              </span>
            ))}
            {idx < meaningfulItems.length - 1 && "; "}
          </span>
        );
      })}
    </Text>
  );
}

function toUIState(
  annotated: LookalikeComparisonAnnotatedState,
): UICharacterState {
  switch (annotated.kind) {
    case "categorical":
      return {
        kind: "categorical",
        trait: {
          id: annotated.trait.id,
          label: annotated.trait.label,
          hasInfo: annotated.trait.hasInfo,
          hexCode: annotated.trait.hexCode,
        },
        modifiers: annotated.modifiers,
      };
    case "number":
      return {
        kind: "number",
        siBaseValue: annotated.siBaseValue,
        unit: annotated.unit
          ? { symbol: annotated.unit.symbol, scale: annotated.unit.scale }
          : null,
        modifiers: annotated.modifiers,
      };
    case "range":
      return {
        kind: "range",
        siBaseMin: annotated.siBaseMin,
        siBaseMax: annotated.siBaseMax,
        unit: annotated.unit
          ? { symbol: annotated.unit.symbol, scale: annotated.unit.scale }
          : null,
        modifiers: annotated.modifiers,
      };
  }
}

function getMeaningfulCharacters(
  items: LookalikeComparisonCharacter[] | null,
): LookalikeComparisonCharacter[] | null {
  if (!items) return null;
  return items.filter((item) => item.states.length > 0);
}

function getAnnotatedStateKey(
  state: LookalikeComparisonAnnotatedState,
): string {
  switch (state.kind) {
    case "categorical":
      return `categorical-${state.trait.id}-${state.modifiers.map((m) => m.id).join("-")}`;
    case "number":
      return `number-${state.siBaseValue}-${state.unit?.symbol ?? "none"}-${state.modifiers.map((m) => m.id).join("-")}`;
    case "range":
      return `range-${state.siBaseMin ?? "none"}-${state.siBaseMax ?? "none"}-${state.unit?.symbol ?? "none"}-${state.modifiers.map((m) => m.id).join("-")}`;
  }
}

/** Whether a value matches its opposite number, the only distinction the modal draws. */
function differenceClassname(differs: boolean): string {
  return differs
    ? "lookalike-modal__value--different"
    : "lookalike-modal__value--shared";
}

function taxonImageSrc(taxon: TaxonDTO) {
  const primaryMedia = taxon.media[0];
  return primaryMedia ? getMediaUrl(primaryMedia.storageKey) : PLACEHOLDER_SRC;
}
