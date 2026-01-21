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
import { CharacterStateDisplay } from "../../../../../components/trait-tokens/CharacterStateDisplay";
import { UICharacterState } from "../../../../../components/trait-tokens/types";
import {
  LookalikeComparisonAnnotatedState,
  LookalikeComparisonCharacter,
  LookalikeComparisonDetailDTO,
} from "../../../../../lib/domain/lookalikes/types";
import { TaxonDTO } from "../../../../../lib/domain/taxa/types";
import { lookalikeDetailsQueryOptions } from "../../../../../lib/queries/lookalikes";

function toUIState(
  annotated: LookalikeComparisonAnnotatedState,
): UICharacterState {
  switch (annotated.kind) {
    case "categorical":
      return {
        ...annotated,
        traitValues: annotated.traits.map((t) => ({
          ...t,
          weight: t.isOverlapping ? undefined : "bold",
        })),
      };

    case "number":
    case "range":
      return {
        ...annotated,
        unit: annotated.unit
          ? {
              symbol: annotated.unit.symbol,
              scale: annotated.unit.scale,
            }
          : null,
        weight: annotated.isOverlapping ? undefined : "bold",
      };
  }
}

function GroupDataList({ items }: { items: LookalikeComparisonCharacter[] }) {
  return (
    <DataList.Root size="2" orientation="vertical">
      {items.map((it) => {
        if (!it.state) return null;

        return (
          <DataList.Item key={it.characterId}>
            <DataList.Label>{it.characterLabel}</DataList.Label>
            <DataList.Value>
              <CharacterStateDisplay state={toUIState(it.state)} />
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
      <Table.Root style={{ tableLayout: "fixed" }}>
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
      <Dialog.Content>{content}</Dialog.Content>
    </Dialog.Root>
  );
});
