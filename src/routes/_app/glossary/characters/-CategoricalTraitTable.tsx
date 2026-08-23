import { Box, Flex, IconButton, Table, Text } from "@radix-ui/themes";
import { useMemo } from "react";
import { PiPencil, PiTrash } from "react-icons/pi";
import { ResponsiveTooltip } from "../../../../components/ResponsiveTooltip";
import { ColorBubble } from "../../../../components/state-formatting/helpers/ColorBubble";
import type { TraitValueDTO } from "../../../../lib/domain/traits/types";
import { getMediaUrl } from "../../../../lib/storage/getMediaUrl";

type RootProps = {
  values: TraitValueDTO[];
  showActions?: boolean;
  onDeleteClick?: (value: TraitValueDTO) => void;
  onEditClick?: (value: TraitValueDTO) => void;
};

type RowProps = {
  value: TraitValueDTO;
  showActions: boolean;
  onDeleteClick?: (value: TraitValueDTO) => void;
  onEditClick?: (value: TraitValueDTO) => void;
};

export default function CategoricalTraitTable({
  values,
  showActions = false,
  onDeleteClick,
  onEditClick,
}: RootProps) {
  return (
    <Table.Root size="1" variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Trait</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Synonyms</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Media</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Usages</Table.ColumnHeaderCell>

          {showActions && (
            <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
          )}
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {values.length === 0 ? (
          <Table.Row>
            <Table.Cell colSpan={showActions ? 6 : 5}>
              <Text color="gray">No values found.</Text>
            </Table.Cell>
          </Table.Row>
        ) : (
          values.map((val) => (
            <Row
              key={val.id}
              value={val}
              showActions={showActions}
              onDeleteClick={onDeleteClick}
              onEditClick={onEditClick}
            />
          ))
        )}
      </Table.Body>
    </Table.Root>
  );
}

function Row({ value, showActions, onDeleteClick, onEditClick }: RowProps) {
  const noDeletionReason: string | null = useMemo(
    () => (value.usageCount > 0 ? "Value in use" : null),
    [value],
  );

  const deleteButton = useMemo(() => {
    if (noDeletionReason) {
      return (
        <ResponsiveTooltip content={noDeletionReason}>
          <IconButton variant="ghost" size="1" color="tomato" disabled>
            <PiTrash />
          </IconButton>
        </ResponsiveTooltip>
      );
    }
    return (
      <IconButton
        variant="ghost"
        size="1"
        color="tomato"
        onClick={() => onDeleteClick?.(value)}
      >
        <PiTrash />
      </IconButton>
    );
  }, [noDeletionReason, onDeleteClick, value]);

  return (
    <Table.Row>
      <Table.Cell>
        <Text>{value.label}</Text>
        {value.hexCode && (
          <Box ml="1" asChild>
            <ColorBubble hexColor={value.hexCode} />
          </Box>
        )}
      </Table.Cell>

      <Table.Cell>
        <Text color={value.synonyms.length === 0 ? "gray" : undefined}>
          {value.synonyms.length}
        </Text>
      </Table.Cell>

      <Table.Cell>
        <Text>{value.description}</Text>
      </Table.Cell>

      <Table.Cell justify="center">
        {value.media && (
          <img
            src={getMediaUrl(value.media.storageKey)}
            alt={value.media.title || value.label}
            loading="lazy"
            style={{
              width: "32px",
              height: "32px",
              objectFit: "cover",
              borderRadius: "var(--radius-2)",
              display: "block",
            }}
          />
        )}
      </Table.Cell>

      <Table.Cell>
        <Text>{value.usageCount}</Text>
      </Table.Cell>

      {showActions && (
        <Table.Cell>
          <Flex align="center" height="100%" gap="2">
            <IconButton
              variant="ghost"
              size="1"
              onClick={() => onEditClick?.(value)}
            >
              <PiPencil />
            </IconButton>
            {deleteButton}
          </Flex>
        </Table.Cell>
      )}
    </Table.Row>
  );
}
