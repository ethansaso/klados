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
import { useEffect, useRef, useState, type RefObject } from "react";
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
  const [activeIndex, setActiveIndex] = useState(-1);

  // Auto-activate first item whenever the list updates (mirrors Ariakit autoSelect="always").
  useEffect(() => {
    setActiveIndex(available.length > 0 ? 0 : -1);
  }, [suggestions, modifiers]);

  const handleAdd = (m: ModifierTokenFormValue) => {
    onAdd(m);
    // Reset the text input and clear the committed query.
    setQ("");
    setInputKey((k) => k + 1);
    // Defer focus until after React reconciles the remounted DebouncedTextField.
    requestAnimationFrame(() => filterInputRef.current?.focus());
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const buttons =
        listRef.current?.querySelectorAll<HTMLButtonElement>("button");
      if (buttons?.length) {
        buttons[0]?.focus();
        setActiveIndex(0);
      }
    } else if (
      e.key === "Enter" &&
      activeIndex >= 0 &&
      available[activeIndex]
    ) {
      e.preventDefault();
      handleAdd(available[activeIndex]!);
    }
  };

  const handleListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const buttons = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? [],
    );
    const idx = buttons.indexOf(e.target as HTMLButtonElement);
    if (idx === -1) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      buttons[idx + 1]?.focus();
      setActiveIndex(idx + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (idx === 0) {
        filterInputRef.current?.focus();
        setActiveIndex(0);
      } else {
        buttons[idx - 1]?.focus();
        setActiveIndex(idx - 1);
      }
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
        onDebouncedChange={setQ}
        onKeyDown={handleInputKeyDown}
        mb="2"
      />

      {/* ── Available modifiers list ── */}
      <ScrollArea type="auto" scrollbars="vertical" style={{ maxHeight: 200 }}>
        {isFetching ? (
          <Text size="1" color="gray">
            Searching…
          </Text>
        ) : available.length === 0 ? (
          <Text size="1" color="gray">
            No matching modifiers found.
          </Text>
        ) : (
          <Flex
            ref={listRef}
            direction="column"
            gap="0"
            onKeyDown={handleListKeyDown}
            pr="3"
          >
            {available.map((m, i) => (
              <Button
                key={m.id}
                type="button"
                variant="ghost"
                color="gray"
                size="1"
                style={{ width: "100%", justifyContent: "space-between" }}
                className="modifier-tag__available-item"
                data-active-item={i === activeIndex || undefined}
                onMouseEnter={() => setActiveIndex(i)}
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
