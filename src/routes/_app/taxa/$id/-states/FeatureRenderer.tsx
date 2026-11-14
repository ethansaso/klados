import "./FeatureRenderer.css";

import { Box, HoverCard, Link, Strong, Text } from "@radix-ui/themes";
import { Fragment } from "react";
import { GlossaryCharacterCard } from "../../../../../components/glossary-cards/GlossaryCharacterCard";
import { GlossaryFeatureCard } from "../../../../../components/glossary-cards/GlossaryFeatureCard";
import { CharacterStateDisplay } from "../../../../../components/state-formatting/CharacterStateDisplay";
import type { FeatureStateDTO } from "../../../../../lib/domain/states/types";
import { formatPublicationUsage } from "../../../../../lib/utils/formatting/formatPublication";
import type { NumberedFeatureCitation } from "../edit/-sources/citableSources";
import { groupStatesByCharacter, PRESENCE_LABELS } from "./featureText";

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

  const entries = groupStatesByCharacter(feature.states);
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
    <>
      {/* Word joiner to avoid starting a line w/ a footnote */}
      {"\u2060"}
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
    </>
  );
}
