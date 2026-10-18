import "./FeatureRenderer.css";

import { Box, HoverCard, Link, Strong, Text } from "@radix-ui/themes";
import { Fragment } from "react";
import type { FeaturePresence } from "../../../../../../db/schema/schema";
import { GlossaryCharacterCard } from "../../../../../components/glossary-cards/GlossaryCharacterCard";
import { GlossaryFeatureCard } from "../../../../../components/glossary-cards/GlossaryFeatureCard";
import { CharacterStateDisplay } from "../../../../../components/state-formatting/CharacterStateDisplay";
import type {
  CharacterStateDTO,
  FeatureStateDTO,
} from "../../../../../lib/domain/states/types";
import { formatPublicationUsage } from "../../../../../lib/utils/formatting/formatPublication";
import type { NumberedFeatureCitation } from "../edit/-sources/citableSources";

const PRESENCE_LABELS: Record<FeaturePresence, string> = {
  present: "present",
  variable: "sometimes present",
  absent: "absent",
};

export const FeatureRenderer = ({
  feature,
  citations,
  indentDescription,
}: {
  feature: FeatureStateDTO;
  /** Keyed by source ID. */
  citations: Map<number, NumberedFeatureCitation>;
  indentDescription?: boolean;
}) => {
  const notes = feature.notes.trim();

  const cardHeaderComponent = feature.featureHasInfo ? (
    <GlossaryFeatureCard id={feature.featureId}>
      <span className="has-information">{feature.featureLabel}</span>
    </GlossaryFeatureCard>
  ) : (
    feature.featureLabel
  );

  // Group states by characterId, preserving order of first appearance.
  const characterGroups = new Map<
    number,
    {
      label: string;
      hasInfo: boolean;
      showInProse: boolean;
      states: CharacterStateDTO[];
    }
  >();
  for (const state of feature.states) {
    let group = characterGroups.get(state.characterId);
    if (!group) {
      group = {
        label: state.characterLabel,
        hasInfo: state.characterHasInfo,
        showInProse: state.showInProse,
        states: [],
      };
      characterGroups.set(state.characterId, group);
    }
    group.states.push(state);
  }
  const entries = Array.from(characterGroups.entries());
  const Wrapper = indentDescription ? Box : Fragment;

  return (
    <Wrapper>
      <Text>
        <Strong>{cardHeaderComponent} </Strong>
      </Text>
      {feature.presence === "variable" && entries.length > 0 && (
        <Text>when present, </Text>
      )}
      {entries.length > 0 ? (
        entries.map(
          ([characterId, { label, hasInfo, states, showInProse }], idx) => {
            const dlLabel = hasInfo ? (
              <GlossaryCharacterCard id={characterId}>
                <span className="has-information">{label.toLowerCase()}</span>
              </GlossaryCharacterCard>
            ) : (
              label.toLowerCase()
            );

            return (
              <Fragment key={characterId}>
                {showInProse && <>{dlLabel} </>}
                <CharacterStateDisplay states={states} forceLowercase />
                {idx < entries.length - 1 ? "; " : ""}
              </Fragment>
            );
          },
        )
      ) : (
        <Text>{PRESENCE_LABELS[feature.presence]}</Text>
      )}
      {notes.length > 0 && <>; {notes}</>}.
      <SourceFootnotes
        sourceIds={feature.sourceIds}
        citations={citations}
      />{" "}
    </Wrapper>
  );
};

function SourceFootnotes({
  sourceIds,
  citations,
}: {
  sourceIds: number[];
  citations: Map<number, NumberedFeatureCitation>;
}) {
  const cited = sourceIds
    .flatMap((id) => citations.get(id) ?? [])
    .sort((a, b) => a.number - b.number);
  if (cited.length === 0) return null;

  return (
    <sup className="source-footnotes">
      {cited.map(({ number, source }) => (
        <HoverCard.Root key={source.sourceId}>
          <HoverCard.Trigger>
            <Link href={`#source-${source.sourceId}`}>[{number}]</Link>
          </HoverCard.Trigger>
          <HoverCard.Content size="1" maxWidth="320px">
            <Text as="p" size="1">
              {formatPublicationUsage(source)}
            </Text>
          </HoverCard.Content>
        </HoverCard.Root>
      ))}
    </sup>
  );
}
