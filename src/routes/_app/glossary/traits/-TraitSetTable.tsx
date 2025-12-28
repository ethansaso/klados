import { Flex, IconButton, Table, Text, Tooltip } from "@radix-ui/themes";
import { useMemo } from "react";
import { PiPencil, PiTrash } from "react-icons/pi";
import { ColorBubble } from "../../../../components/trait-tokens/ColorBubble";
import { TraitValueDTO } from "../../../../lib/domain/traits/types";

type RootProps = {
  values: TraitValueDTO[];
  showActions: boolean;
  onDeleteClick?: (value: TraitValueDTO) => void;
  onEditClick?: (value: TraitValueDTO) => void;
};

type RowProps = {
  value: TraitValueDTO;
  showActions: boolean;
  onDeleteClick?: (value: TraitValueDTO) => void;
  onEditClick?: (value: TraitValueDTO) => void;
};

export default function TraitValuesTable({
  values,
  showActions = false,
  onDeleteClick,
  onEditClick,
}: RootProps) {
  return (
    <Table.Root size="1">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell width="45px">Icon</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Trait</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Alias for</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
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
              No values found.
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
  const noDeletionReason: string | null = useMemo(() => {
    if (value.usageCount > 0) {
      return `Used ${value.usageCount} time${value.usageCount > 1 ? "s" : ""}`;
    }
    if (!value.aliasTarget && (value.aliasCount ?? 0) > 0) {
      return `Has ${value.aliasCount} alias${value.aliasCount > 1 ? "es" : ""}`;
    }
    return null;
  }, [value]);

  const deleteButton = useMemo(() => {
    if (noDeletionReason) {
      return (
        <Tooltip content={noDeletionReason}>
          <IconButton variant="ghost" size="1" color="tomato" disabled>
            <PiTrash />
          </IconButton>
        </Tooltip>
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
      <Table.Cell justify="center">
        {value.hexCode && <ColorBubble size={12} hexColor={value.hexCode} />}
      </Table.Cell>

      <Table.Cell>
        <Text>{value.label}</Text>
      </Table.Cell>

      <Table.Cell>
        {!value.aliasTarget ? (
          <Text color="gray">------</Text>
        ) : (
          <Text>{value.aliasTarget.label}</Text>
        )}
      </Table.Cell>

      <Table.Cell>
        <Text>{value.description}</Text>
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
