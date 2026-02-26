import {
  Badge,
  Button,
  Flex,
  IconButton,
  Popover,
  ScrollArea,
  Separator,
  Text,
  TextField,
} from "@radix-ui/themes";
import type { RefObject } from "react";
import { PiPlus, PiX } from "react-icons/pi";
import {
  filterModifiers,
  groupModifiers,
  type SampleModifier,
} from "../sampleModifiers";

type Props = {
  modifiers: SampleModifier[];
  filterQ: string;
  filterInputRef: RefObject<HTMLInputElement | null>;
  onFilterChange: (q: string) => void;
  onAdd: (m: SampleModifier) => void;
  onRemove: (id: number) => void;
};

export function ModifierPopoverContent({
  modifiers,
  filterQ,
  filterInputRef,
  onFilterChange,
  onAdd,
  onRemove,
}: Props) {
  const usedIds = new Set(modifiers.map((m) => m.id));
  const available = filterModifiers(filterQ).filter((m) => !usedIds.has(m.id));
  const grouped = groupModifiers(available);

  return (
    <>
      {/* ── Header ── */}
      <Flex
        align="center"
        justify="between"
        className="modifier-tag__popover-header"
      >
        <Text size="1" weight="bold">
          Modifiers
        </Text>
        <Popover.Close>
          <IconButton type="button" size="1" variant="ghost" color="gray">
            <PiX size={10} />
          </IconButton>
        </Popover.Close>
      </Flex>

      <Separator orientation="horizontal" size="4" mt="1" mb="2" />

      {/* ── Currently applied ── */}
      <Flex wrap="wrap" gap="1" mb={modifiers.length ? "2" : "0"}>
        {modifiers.map((m) => (
          <Badge
            key={m.id}
            variant="soft"
            color={m.affixType === "prefix" ? "crimson" : "cyan"}
            className="modifier-tag__applied-pill"
          >
            <Flex align="center" gap="1">
              <Text size="1">{m.value}</Text>
              <IconButton
                size="1"
                type="button"
                variant="ghost"
                onClick={() => onRemove(m.id)}
              >
                <PiX />
              </IconButton>
            </Flex>
          </Badge>
        ))}
      </Flex>

      {/* ── Filter input ── */}
      <TextField.Root
        ref={filterInputRef}
        size="1"
        placeholder="Filter modifiers…"
        value={filterQ}
        onChange={(e) => onFilterChange(e.target.value)}
        mb="2"
      />

      {/* ── Available modifiers list ── */}
      <ScrollArea type="auto" scrollbars="vertical" style={{ maxHeight: 200 }}>
        {grouped.length === 0 && (
          <Text size="1" color="gray">
            No matching modifiers found.
          </Text>
        )}
        {grouped.map((group) => (
          <div key={group.groupId}>
            <Text
              size="1"
              color="gray"
              weight="bold"
              className="modifier-tag__group-label"
            >
              {group.groupLabel}
            </Text>
            <Flex wrap="wrap" gap="1" mb="1">
              {group.items.map((m) => (
                <Button
                  key={m.id}
                  type="button"
                  color="gray"
                  variant="soft"
                  highContrast
                  size="1"
                  className="modifier-tag__available-item"
                  onClick={() => onAdd(m)}
                >
                  <PiPlus size={9} />
                  {m.value}
                </Button>
              ))}
            </Flex>
          </div>
        ))}
      </ScrollArea>
    </>
  );
}
