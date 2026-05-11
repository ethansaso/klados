import NiceModal, { useModal } from "@ebay/nice-modal-react";
import {
  AspectRatio,
  Box,
  DataList,
  Dialog,
  Heading,
  Table,
  Text,
} from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { CharacterStateDisplay } from "../../../../../components/state-formatting/CharacterStateDisplay";
import type { UICharacterState } from "../../../../../components/state-formatting/types";
import type {
  LookalikeComparisonAnnotatedState,
  LookalikeComparisonCharacter,
  LookalikeComparisonDetailDTO,
} from "../../../../../lib/domain/lookalikes/types";
import type { TaxonDTO } from "../../../../../lib/domain/taxa/types";
import { lookalikeDetailsQueryOptions } from "../../../../../lib/queries/lookalikes";

function toUIState(
  annotated: LookalikeComparisonAnnotatedState,
): UICharacterState[] {
  switch (annotated.kind) {
    case "categorical":
      return annotated.traits.map((t) => ({
        kind: "categorical" as const,
        trait: {
          id: t.id,
          label: t.label,
          description: t.description ?? undefined,
          hexCode: t.hexCode,
          weight: t.isOverlapping ? undefined : ("bold" as const),
        },
        modifiers: [],
      }));

    case "number":
      return annotated.entries.map((e) => ({
        kind: "number" as const,
        siBaseValue: e.siBaseValue,
        unit: e.unit
          ? { symbol: e.unit.symbol, scale: e.unit.scale }
          : null,
        modifiers: e.modifiers,
        weight: e.isOverlapping ? undefined : ("bold" as const),
      }));

    case "range":
      return annotated.entries.map((e) => ({
        kind: "range" as const,
        siBaseMin: e.siBaseMin,
        siBaseMax: e.siBaseMax,
        unit: e.unit
          ? { symbol: e.unit.symbol, scale: e.unit.scale }
          : null,
        modifiers: e.modifiers,
        weight: e.isOverlapping ? undefined : ("bold" as const),
      }));
  }
}

function GroupDataList({
  items,
}: {
  items: LookalikeComparisonCharacter[] | null;
}) {
  if (!items) return null;
  if (items.length === 0) return <Text color="gray">Present</Text>;

  return (
    <DataList.Root size="2" orientation="vertical">
      {items.map((it) => {
        if (!it.state) return null;

        return (
          <DataList.Item key={it.characterId}>
            <DataList.Label>{it.characterLabel}</DataList.Label>
            <DataList.Value>
              <CharacterStateDisplay states={toUIState(it.state)} />
            </DataList.Value>
          </DataList.Item>
        );
      })}
    </DataList.Root>
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
          src={primaryMedia?.url ?? "/logos/LogoDotted.svg"}
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
    <Box>
      <Table.Root className="lookalike-table">
        <colgroup>
          <col style={{ width: "20%" }} />
          <col style={{ width: "40%" }} />
          <col style={{ width: "40%" }} />
        </colgroup>

        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell />
            <Table.ColumnHeaderCell>
              <TaxonColumnHeader taxon={data.a} />
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>
              <TaxonColumnHeader taxon={data.b} />
            </Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {data.groupedStates.map((annotatedGroup) => (
            <Table.Row key={annotatedGroup.groupId} align="start">
              <Table.RowHeaderCell>
                <Text weight="medium">{annotatedGroup.groupLabel}</Text>
              </Table.RowHeaderCell>

              <Table.Cell>
                <GroupDataList items={annotatedGroup.aCharacters} />
              </Table.Cell>

              <Table.Cell>
                <GroupDataList items={annotatedGroup.bCharacters} />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
};

export const LookalikeModal = NiceModal.create<{
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
