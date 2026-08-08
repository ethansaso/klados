import {
  Box,
  Button,
  Card,
  DataList,
  Flex,
  Heading,
  IconButton,
  Text,
  TextField,
  Tooltip,
} from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { memo, useCallback, useId, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  PiCheck,
  PiPlus,
  PiSealCheck,
  PiSealQuestion,
  PiTrash,
  PiX,
} from "react-icons/pi";
import type { TaxonEditFormValues } from "..";
import type { TraitSuggestion } from "../../../../../../lib/domain/suggestions/types";
import { featureQueryOptions } from "../../../../../../lib/queries/features";
import { CharacterStateRow } from "./CharacterStateRow";
import { CharacterStateSearch } from "./search/CharacterStateSearch";
import { FEATURE_SEARCH_INPUT_ID } from "./search/FeatureSearch";
import {
  addStateFromSuggestion,
  updateCategoricalTraitValueModifiers,
} from "./stateUtils";
import type { FeatureFormValue, ModifierTokenFormValue } from "./validation";

type LastAdded = {
  characterId: number;
  traitIndex?: number;
  label: string;
};

export const characterSearchInputId = (featureId: number) =>
  `character-search-${featureId}`;

type Props = {
  feature: FeatureFormValue;
  onChange: (nextFeatures: FeatureFormValue[]) => void;
  onDelete: () => void;
  onRemoveCategoricalValue: (
    featureId: number,
    characterId: number,
    stateIndex: number,
  ) => void;
};

export const EditingFeatureCard = memo(
  ({ feature, onChange, onDelete, onRemoveCategoricalValue }: Props) => {
    const { getValues } = useFormContext<TaxonEditFormValues>();
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [notesExpanded, setNotesExpanded] = useState(
      () => feature.notes.length > 0,
    );
    const focusNotesOnExpandRef = useRef(false);
    const [lastAdded, setLastAdded] = useState<LastAdded | null>(null);
    const [autoOpenFor, setAutoOpenFor] = useState<LastAdded | null>(null);
    const searchInputId = characterSearchInputId(feature.featureId);
    const notesInputId = useId();

    const focusSearch = useCallback(() => {
      document.getElementById(searchInputId)?.focus();
    }, [searchInputId]);

    const focusFeatureSearch = useCallback(() => {
      document.getElementById(FEATURE_SEARCH_INPUT_ID)?.focus();
    }, []);

    const { data, isLoading, isError } = useQuery({
      ...featureQueryOptions(feature.featureId),
      staleTime: 5_000,
      refetchOnWindowFocus: true,
    });

    const label = data?.label;

    const setNotesInputRef = useCallback((el: HTMLInputElement | null) => {
      if (el && focusNotesOnExpandRef.current) {
        el.focus();
        focusNotesOnExpandRef.current = false;
      }
    }, []);

    const handleSuggestionSelect = useCallback(
      (s: TraitSuggestion) => {
        const prev = getValues("states");
        const next = addStateFromSuggestion(prev, feature.featureId, s);
        onChange(next);

        const label =
          s.kind === "categorical-value" ? s.traitValueLabel : s.displayValue;
        if (s.kind === "categorical-value") {
          const catStatesForChar =
            next
              .find((g) => g.featureId === feature.featureId)
              ?.characters.filter(
                (c) =>
                  c.characterId === s.characterId && c.kind === "categorical",
              ) ?? [];
          setLastAdded({
            characterId: s.characterId,
            traitIndex: catStatesForChar.length - 1,
            label,
          });
        } else {
          setLastAdded({ characterId: s.characterId, label });
        }
        setAutoOpenFor(null);
      },
      [getValues, onChange, feature.featureId],
    );

    const handleAutoOpenHandled = useCallback(() => {
      setAutoOpenFor(null);
    }, []);

    const handleUpdateCategoricalModifiers = useCallback(
      (
        characterId: number,
        stateIndex: number,
        mods: ModifierTokenFormValue[],
      ) => {
        const prev = getValues("states");
        const next = updateCategoricalTraitValueModifiers(
          prev,
          feature.featureId,
          characterId,
          stateIndex,
          mods,
        );
        onChange(next);
      },
      [getValues, onChange, feature.featureId],
    );

    const handleUpdateNumericModifiers = useCallback(
      (
        characterId: number,
        stateIndex: number,
        mods: ModifierTokenFormValue[],
      ) => {
        const prev = getValues("states");
        const next = prev.map((group) => {
          if (group.featureId !== feature.featureId) return group;

          let numericSeen = -1;

          return {
            ...group,
            characters: group.characters.map((row) => {
              if (
                row.characterId !== characterId ||
                (row.kind !== "number" && row.kind !== "range")
              ) {
                return row;
              }

              numericSeen += 1;
              if (numericSeen !== stateIndex) return row;

              return { ...row, modifiers: mods };
            }),
          };
        });

        onChange(next);
      },
      [getValues, onChange, feature.featureId],
    );

    const handleRemoveNumericState = useCallback(
      (characterId: number, stateIndex: number) => {
        const prev = getValues("states");
        const next = prev.map((group) => {
          if (group.featureId !== feature.featureId) return group;

          let numericSeen = -1;

          return {
            ...group,
            characters: group.characters.filter((row) => {
              if (
                row.characterId !== characterId ||
                (row.kind !== "number" && row.kind !== "range")
              ) {
                return true;
              }

              numericSeen += 1;
              return numericSeen !== stateIndex;
            }),
          };
        });

        onChange(next);
      },
      [getValues, onChange, feature.featureId],
    );

    const handleNotesChange = useCallback(
      (notes: string) => {
        const prev = getValues("states");
        const next = prev.map((group) =>
          group.featureId === feature.featureId ? { ...group, notes } : group,
        );
        onChange(next);
      },
      [getValues, onChange, feature.featureId],
    );

    const handleUnreliableToggle = useCallback(() => {
      const prev = getValues("states");
      const next = prev.map((group) =>
        group.featureId === feature.featureId
          ? { ...group, unreliable: !group.unreliable }
          : group,
      );
      onChange(next);
    }, [getValues, onChange, feature.featureId]);

    // TODO: Immediately delete if no characters exist in group
    const handleTrashClick = () => {
      setConfirmingDelete(true);
    };

    return (
      <Card style={{ display: "flex", flexDirection: "column" }}>
        <Flex
          m="-3"
          p="3"
          py="2"
          mb="1"
          align="center"
          justify="between"
          style={{
            background: "var(--gray-a3)",
            borderBottom: "1px solid var(--gray-a5)",
          }}
        >
          <Heading size="2" weight="bold">
            {label}
          </Heading>
          {confirmingDelete ? (
            <Flex mr="1" gap="2">
              <IconButton
                type="button"
                size="1"
                variant="ghost"
                color="tomato"
                onClick={() => onDelete()}
              >
                <PiCheck size={12} />
              </IconButton>
              <IconButton
                type="button"
                size="1"
                variant="ghost"
                color="gray"
                onClick={() => setConfirmingDelete(false)}
              >
                <PiX size={12} />
              </IconButton>
            </Flex>
          ) : (
            <Flex mr="1" gap="2" align="center">
              <Tooltip
                content={
                  feature.unreliable
                    ? "Not always present on all individuals"
                    : "Present on most or all individuals"
                }
              >
                <Button
                  type="button"
                  size="1"
                  variant="ghost"
                  color={feature.unreliable ? "amber" : "grass"}
                  aria-pressed={feature.unreliable}
                  onClick={handleUnreliableToggle}
                >
                  {feature.unreliable ? (
                    <>
                      <PiSealQuestion size={16} />
                      Unreliable
                    </>
                  ) : (
                    <>
                      <PiSealCheck size={16} />
                      Reliable
                    </>
                  )}
                </Button>
              </Tooltip>
              <IconButton
                type="button"
                size="1"
                variant="ghost"
                color="tomato"
                onClick={handleTrashClick}
              >
                <PiTrash size={16} />
              </IconButton>
            </Flex>
          )}
        </Flex>

        {/* Add states via search */}
        <Box mt="2" mb="3">
          <CharacterStateSearch
            featureId={feature.featureId}
            onSelect={handleSuggestionSelect}
            inputId={searchInputId}
            onModifyShortcut={
              lastAdded ? () => setAutoOpenFor(lastAdded) : undefined
            }
            onEscapeShortcut={focusFeatureSearch}
          />
        </Box>

        {isLoading && <Text size="1">Loading characters…</Text>}
        {isError && (
          <Text size="1" color="red">
            Failed to load group.
          </Text>
        )}

        {data && (
          <DataList.Root size="1">
            {data.characters.map((c) => {
              const statesForCharacter = feature.characters.filter(
                (state) => state.characterId === c.id,
              );

              return (
                <CharacterStateRow
                  key={c.id}
                  character={c}
                  states={statesForCharacter}
                  onRemoveCategoricalTrait={(characterId, stateIndex) =>
                    onRemoveCategoricalValue(
                      feature.featureId,
                      characterId,
                      stateIndex,
                    )
                  }
                  onRemoveNumericState={handleRemoveNumericState}
                  onUpdateCategoricalModifiers={
                    handleUpdateCategoricalModifiers
                  }
                  onUpdateNumericModifiers={handleUpdateNumericModifiers}
                  autoOpenModifierFor={
                    autoOpenFor?.characterId === c.id
                      ? {
                          characterId: autoOpenFor.characterId,
                          traitIndex: autoOpenFor.traitIndex,
                        }
                      : undefined
                  }
                  onAutoOpenHandled={handleAutoOpenHandled}
                  onReturnToSearch={focusSearch}
                />
              );
            })}
          </DataList.Root>
        )}

        <Box mt="auto">
          {notesExpanded ? (
            <>
              <Flex align="center" justify="between" mb="1" mt="3">
                <Text as="label" size="1" htmlFor={notesInputId}>
                  Note
                </Text>
                <Button
                  type="button"
                  size="1"
                  variant="ghost"
                  color="tomato"
                  onClick={() => {
                    handleNotesChange("");
                    setNotesExpanded(false);
                  }}
                >
                  <PiX size={12} />
                  Remove
                </Button>
              </Flex>
              <TextField.Root
                id={notesInputId}
                ref={setNotesInputRef}
                size="1"
                variant="surface"
                value={feature.notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    focusFeatureSearch();
                  }
                }}
              />
            </>
          ) : (
            <Button
              type="button"
              size="1"
              variant="ghost"
              color="gray"
              mt="3"
              ml="1"
              onClick={() => {
                focusNotesOnExpandRef.current = true;
                setNotesExpanded(true);
              }}
            >
              <PiPlus size={10} />
              Add note
            </Button>
          )}
        </Box>
      </Card>
    );
  },
);
