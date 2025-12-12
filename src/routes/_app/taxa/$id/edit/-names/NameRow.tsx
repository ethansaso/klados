import {
  Flex,
  IconButton,
  RadioGroup,
  Text,
  TextField,
} from "@radix-ui/themes";
import { memo, useState } from "react";
import { PiPencil, PiTrash } from "react-icons/pi";
import { NameItem } from "../../../../../../lib/domain/taxon-names/validation";

type NameRowProps = {
  localeLabel: string;
  item: NameItem;
  index: number;
  onNameChange: (index: number, nextValue: string) => void;
  onDelete: (index: number) => void;
};

/**
 * One row in the name list (radio + label/input + actions).
 * Performance optimization to avoid unnecessary re-renders.
 */
export const NameRow = memo(
  ({ localeLabel, item, index, onNameChange, onDelete }: NameRowProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState(item.value || "");

    const startEdit = () => {
      setDraft(item.value || "");
      setIsEditing(true);
    };

    const cancelEdit = () => {
      setIsEditing(false);
      setDraft(item.value || "");
    };

    const commitEdit = () => {
      const trimmed = draft.trim();
      if (!trimmed) {
        cancelEdit();
        return;
      }
      if (trimmed !== item.value) {
        onNameChange(index, trimmed);
      }
      setIsEditing(false);
    };

    return (
      <Flex align="center" gap="2" className="taxon-names__item">
        <Flex align="center" gap="2" className="taxon-names__item__label">
          <RadioGroup.Item value={String(index)}>
            {!isEditing && (
              <Text as="span" color={item.value ? undefined : "gray"}>
                {item.value || "(empty)"}
              </Text>
            )}
          </RadioGroup.Item>
          {isEditing && (
            <TextField.Root
              size="1"
              value={draft}
              autoFocus
              aria-label={`Edit ${localeLabel} name`}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitEdit();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  cancelEdit();
                }
              }}
            />
          )}
        </Flex>

        <Flex align="center" gap="2" className="taxon-names__item__actions">
          <IconButton
            size="1"
            variant="ghost"
            type="button"
            onClick={startEdit}
            aria-label="Edit name"
          >
            <PiPencil size={12} />
          </IconButton>

          <IconButton
            size="1"
            variant="ghost"
            color="tomato"
            type="button"
            onClick={() => onDelete(index)}
            aria-label="Delete name"
          >
            <PiTrash size={12} />
          </IconButton>
        </Flex>
      </Flex>
    );
  }
);
