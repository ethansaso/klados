import { Flex, IconButton, Table, Text } from "@radix-ui/themes";
import { PiPencil, PiTrash } from "react-icons/pi";
import type { ModifierDTO } from "../../../../lib/domain/modifiers/types";
import { getMediaUrl } from "../../../../lib/storage/getMediaUrl";

type RootProps = {
  values: ModifierDTO[];
  showActions?: boolean;
  onDeleteClick?: (value: ModifierDTO) => void;
  onEditClick?: (value: ModifierDTO) => void;
};

type RowProps = {
  value: ModifierDTO;
  showActions: boolean;
  onDeleteClick?: (value: ModifierDTO) => void;
  onEditClick?: (value: ModifierDTO) => void;
};

export default function ModifierTable({
  values,
  showActions = false,
  onDeleteClick,
  onEditClick,
}: RootProps) {
  return (
    <Table.Root size="1" variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Value</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Affix Type</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell justify="center">
            Media
          </Table.ColumnHeaderCell>
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
  return (
    <Table.Row>
      <Table.Cell>
        <Text weight="medium">{value.label}</Text>
      </Table.Cell>

      <Table.Cell>
        <Text>{value.affixType}</Text>
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
            <IconButton
              variant="ghost"
              size="1"
              color="tomato"
              onClick={() => onDeleteClick?.(value)}
            >
              <PiTrash />
            </IconButton>
          </Flex>
        </Table.Cell>
      )}
    </Table.Row>
  );
}
