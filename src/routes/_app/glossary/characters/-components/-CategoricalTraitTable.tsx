import { Box, Flex, IconButton, Table, Text } from "@radix-ui/themes";
import { useMemo } from "react";
import { PiPencil, PiShareFat, PiTrash } from "react-icons/pi";
import { applyToSynonymsBlocker } from "../-hooks/useSynonymApply";
import { ResponsiveTooltip } from "../../../../../components/ResponsiveTooltip";
import { ColorBubble } from "../../../../../components/state-formatting/helpers/ColorBubble";
import type { TraitValueDTO } from "../../../../../lib/domain/traits/types";
import { getMediaUrl } from "../../../../../lib/storage/getMediaUrl";

type RootProps = {
  values: TraitValueDTO[];
  showActions?: boolean;
  onDeleteClick?: (value: TraitValueDTO) => void;
  onEditClick?: (value: TraitValueDTO) => void;
  onApplyClick?: (value: TraitValueDTO) => void;
};

type RowProps = {
  value: TraitValueDTO;
  showActions: boolean;
  onDeleteClick?: (value: TraitValueDTO) => void;
  onEditClick?: (value: TraitValueDTO) => void;
  onApplyClick?: (value: TraitValueDTO) => void;
};

export default function CategoricalTraitTable({
  values,
  showActions = false,
  onDeleteClick,
  onEditClick,
  onApplyClick,
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
              onApplyClick={onApplyClick}
            />
          ))
        )}
      </Table.Body>
    </Table.Root>
  );
}

function Row({
  value,
  showActions,
  onDeleteClick,
  onEditClick,
  onApplyClick,
}: RowProps) {
  const applyBlocker = applyToSynonymsBlocker(value);

  const noDeletionReason: string | null = useMemo(() => {
    if (value.isCanonical) return "Canonical terms can't be deleted";
    return value.usageCount > 0 ? "Value in use" : null;
  }, [value]);

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
        {value.hexCode && (
          <Box mr="2" asChild>
            <ColorBubble hexColor={value.hexCode} />
          </Box>
        )}
        <Text weight="medium">{value.label}</Text>
      </Table.Cell>

      <Table.Cell>
        <Text>{value.synonyms.length}</Text>
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
            <ResponsiveTooltip content={applyBlocker ?? "Apply to synonyms"}>
              <IconButton
                variant="ghost"
                size="1"
                aria-label="Apply to synonyms"
                disabled={!!applyBlocker}
                onClick={() => onApplyClick?.(value)}
              >
                <PiShareFat />
              </IconButton>
            </ResponsiveTooltip>
            {deleteButton}
          </Flex>
        </Table.Cell>
      )}
    </Table.Row>
  );
}
