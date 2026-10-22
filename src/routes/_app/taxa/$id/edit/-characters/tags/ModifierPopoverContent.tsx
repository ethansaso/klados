import {
  Badge,
  Box,
  Button,
  Flex,
  IconButton,
  Popover,
  ScrollArea,
  Separator,
  Text,
} from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { PiPlus, PiX } from "react-icons/pi";
import { DebouncedTextField } from "../../../../../../../components/inputs/DebouncedTextField";
import { modifierSuggestionsQueryOptions } from "../../../../../../../lib/queries/suggestions";
import type { ModifierTokenFormValue } from "../validation";

type Props = {
  modifiers: ModifierTokenFormValue[];
  filterInputRef: RefObject<HTMLInputElement | null>;
  onAdd: (m: ModifierTokenFormValue) => void;
  onRemove: (id: number) => void;
};

export function ModifierPopoverContent({
  modifiers,
  filterInputRef,
  onAdd,
  onRemove,
}: Props) {
  // `q` is the debounced/committed query that drives the server call.
  const [q, setQ] = useState("");
  // Incrementing this key remounts DebouncedTextField, resetting its input.
  const [inputKey, setInputKey] = useState(0);

  const { data: suggestions = [], isFetching } = useQuery(
    modifierSuggestionsQueryOptions(q),
  );

  // Map to ModifierTokenFormValue shape and filter out already-applied IDs.
  const usedIds = new Set(modifiers.map((m) => m.id));
  const available = suggestions
    .filter((s) => !usedIds.has(s.id))
    .map((s): ModifierTokenFormValue => ({
      id: s.id,
      label: s.label,
      affixType: s.affixType,
      groupId: s.groupId,
      groupLabel: s.groupLabel,
    }));

  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  // Focus stays in the input; arrows move this highlight, Enter adds it
  const [activeIndexRaw, setActiveIndexRaw] = useState(0);
  const activeIndex = available.length
    ? Math.min(activeIndexRaw, available.length - 1)
    : -1;

  useEffect(() => {
    listRef.current
      ?.querySelector("[data-active-item]")
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, available.length]);

  const handleQueryChange = (next: string) => {
    setQ(next);
    setActiveIndexRaw(0);
  };

  const handleAdd = (m: ModifierTokenFormValue) => {
    onAdd(m);
    // Reset the text input and clear the committed query.
    setQ("");
    setActiveIndexRaw(0);
    setInputKey((k) => k + 1);
    // Defer focus until after React reconciles the remounted DebouncedTextField.
    requestAnimationFrame(() => filterInputRef.current?.focus());
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndexRaw(Math.min(activeIndex + 1, available.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndexRaw(Math.max(activeIndex - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      // Rows may be from the last search while the next is pending or loading
      if (e.currentTarget.value !== q || isFetching) return;
      const m = available[activeIndex];
      if (m) handleAdd(m);
    }
  };

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
              <Text size="1">{m.label}</Text>
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
      <DebouncedTextField
        key={inputKey}
        ref={filterInputRef}
        size="1"
        placeholder="Search modifiers…"
        initialValue=""
        onDebouncedChange={handleQueryChange}
        onKeyDown={handleInputKeyDown}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded
        aria-controls={listId}
        aria-activedescendant={
          activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
        }
        mb="2"
      />

      {/* ── Available modifiers list ── */}
      <ScrollArea type="auto" scrollbars="vertical" style={{ maxHeight: 200 }}>
        {available.length === 0 ? (
          <Text size="1" color="gray">
            {isFetching ? "Searching…" : "No matching modifiers found."}
          </Text>
        ) : (
          <Flex
            ref={listRef}
            id={listId}
            role="listbox"
            direction="column"
            gap="0"
            pr="3"
          >
            {available.map((m, i) => (
              <Button
                key={m.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                // Reached by arrows from the input, not by Tab
                tabIndex={-1}
                type="button"
                variant="ghost"
                color="gray"
                size="1"
                style={{ width: "100%", justifyContent: "space-between" }}
                className="modifier-tag__available-item"
                data-active-item={i === activeIndex || undefined}
                onMouseEnter={() => setActiveIndexRaw(i)}
                onClick={() => handleAdd(m)}
              >
                <Flex align="center" gap="1">
                  <Box flexShrink="0" asChild>
                    <PiPlus size={9} />
                  </Box>
                  <Text size="1" align="left">
                    {m.label}
                  </Text>
                </Flex>
                <Text size="1" color="gray" align="right">
                  {m.groupLabel}
                </Text>
              </Button>
            ))}
          </Flex>
        )}
      </ScrollArea>
    </>
  );
}
