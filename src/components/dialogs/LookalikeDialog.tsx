import NiceModal, { useModal } from "@ebay/nice-modal-react";
import {
  AspectRatio,
  Box,
  Dialog,
  Grid,
  Heading,
  Text,
} from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type {
  LookalikeComparisonAnnotatedState,
  LookalikeComparisonCharacter,
  LookalikeComparisonDetailDTO,
  LookalikeComparisonPresence,
} from "../../lib/domain/lookalikes/types";
import type { TaxonDTO } from "../../lib/domain/taxa/types";
import { lookalikeDetailsQueryOptions } from "../../lib/queries/lookalikes";
import { getMediaUrl } from "../../lib/storage/getMediaUrl";
import { GlossaryFeatureCard } from "../glossary-cards/GlossaryFeatureCard";
import { CharacterStateDisplay } from "../state-formatting/CharacterStateDisplay";
import type { UICharacterState } from "../state-formatting/types";
import "./LookalikeDialog.css";

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

const PRESENCE_COPY: Record<LookalikeComparisonPresence, string> = {
  unstated: "\u2014",
  present: "present",
  variable: "sometimes present",
  absent: "absent",
};

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

  // No feature state / no character states, just short circuit to copy
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

const TaxonColumnHeader = ({ taxon }: { taxon: TaxonDTO }) => {
  const primaryMedia = taxon.media[0];

  return (
    <Box>
      <Heading size="4" mb="2">
        {taxon.acceptedName}
      </Heading>
      <AspectRatio ratio={1}>
        <img
          src={
            primaryMedia
              ? getMediaUrl(primaryMedia.storageKey)
              : "/logos/LogoDotted.svg"
          }
          alt={taxon.acceptedName}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/logos/LogoDotted.svg";
          }}
          style={{
            objectFit: "cover",
            width: "100%",
            height: "100%",
            borderRadius: "var(--radius-3)",
          }}
        />
      </AspectRatio>
    </Box>
  );
};

const ModalContent = ({ data }: { data: LookalikeComparisonDetailDTO }) => {
  return (
    <Box className="lookalike-modal__comparison">
      <Grid columns="2" gap="4" className="lookalike-modal__taxa">
        <TaxonColumnHeader taxon={data.a} />
        <TaxonColumnHeader taxon={data.b} />
      </Grid>

      <Box className="lookalike-modal__groups">
        {data.groupedStates.map((annotatedGroup) => {
          const presenceDiffers =
            annotatedGroup.aPresence !== annotatedGroup.bPresence;

          return (
            <Box
              key={annotatedGroup.groupId}
              className="lookalike-modal__group"
            >
              <Box className="lookalike-modal__group-header">
                {annotatedGroup.groupHasInfo ? (
                  <GlossaryFeatureCard id={annotatedGroup.groupId}>
                    <Text as="span" weight="bold">
                      <span className="has-information">
                        {annotatedGroup.groupLabel}
                      </span>
                    </Text>
                  </GlossaryFeatureCard>
                ) : (
                  <Text as="span" weight="bold">
                    {annotatedGroup.groupLabel}
                  </Text>
                )}
              </Box>

              <Grid
                columns={{ initial: "1", sm: "2" }}
                className="lookalike-modal__group-body"
              >
                <Box className="lookalike-modal__group-column">
                  <GroupDataList
                    presence={annotatedGroup.aPresence}
                    presenceDiffers={presenceDiffers}
                    items={annotatedGroup.aCharacters}
                    emphasizeAll={
                      presenceDiffers ||
                      !getMeaningfulCharacters(annotatedGroup.bCharacters)
                        ?.length
                    }
                  />
                </Box>

                <Box className="lookalike-modal__group-column">
                  <GroupDataList
                    presence={annotatedGroup.bPresence}
                    presenceDiffers={presenceDiffers}
                    items={annotatedGroup.bCharacters}
                    emphasizeAll={
                      presenceDiffers ||
                      !getMeaningfulCharacters(annotatedGroup.aCharacters)
                        ?.length
                    }
                  />
                </Box>
              </Grid>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
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
      <Dialog.Content className="lookalike-modal">{content}</Dialog.Content>
    </Dialog.Root>
  );
});
