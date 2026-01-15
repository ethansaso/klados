import {
  Box,
  Button,
  Checkbox,
  Flex,
  Text,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { Label } from "radix-ui";
import { useMemo, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { SelectCombobox } from "../../../../../components/inputs/combobox/SelectCombobox";
import { ComboboxOption } from "../../../../../components/inputs/combobox/types";
import {
  a11yProps,
  ConditionalAlert,
} from "../../../../../components/inputs/ConditionalAlert";
import type { CreateCategoricalCharacterInput } from "../../../../../lib/domain/characters/validation";
import { useAutoKey } from "../../../../../lib/hooks/useAutoKey";
import { characterGroupsQueryOptions } from "../../../../../lib/queries/characterGroups";
import { traitSetsQueryOptions } from "../../../../../lib/queries/traits";

export function AddCategoricalCharacterForm() {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<CreateCategoricalCharacterInput>();

  const { autoKey, setAutoKey, handleKeyBlur } = useAutoKey(
    control,
    setValue,
    "label",
    "key"
  );

  const [traitSetQuery, setTraitSetQuery] = useState("");
  const [groupQuery, setGroupQuery] = useState("");

  const { data: traitSetResp } = useQuery(
    traitSetsQueryOptions(1, 10, { q: traitSetQuery })
  );
  const { data: groupResp } = useQuery(
    characterGroupsQueryOptions(1, 10, { q: groupQuery })
  );

  const traitSetOptions = (traitSetResp?.items.map((i) => ({
    id: i.id,
    label: i.label,
    hint: i.description,
  })) ?? []) as ComboboxOption[];

  const groupOptions = (groupResp?.items ?? []) as ComboboxOption[];

  const traitSetIdVal = useWatch({ control, name: "traitSetId" });
  const groupIdVal = useWatch({ control, name: "groupId" });

  const traitSetSelected = useMemo<ComboboxOption | null>(() => {
    if (!traitSetIdVal) return null;
    return traitSetOptions.find((o) => o.id === Number(traitSetIdVal)) ?? null;
  }, [traitSetIdVal, traitSetOptions]);

  const groupSelected = useMemo<ComboboxOption | null>(() => {
    if (!groupIdVal) return null;
    return groupOptions.find((o) => o.id === Number(groupIdVal)) ?? null;
  }, [groupIdVal, groupOptions]);

  return (
    <Flex direction="column" gap="3" mb="4">
      <Box>
        <Flex justify="between" align="baseline" mb="1">
          <Label.Root htmlFor="label">Label</Label.Root>
          <ConditionalAlert id="label-error" message={errors.label?.message} />
        </Flex>
        <TextField.Root
          id="label"
          type="text"
          placeholder="e.g. cap color, spore diameter"
          {...register("label")}
          {...a11yProps("label-error", !!errors.label)}
        />
      </Box>

      <Box>
        <Flex justify="between" align="baseline" mb="1">
          <Label.Root htmlFor="key">Key</Label.Root>
          <Flex align="center" gap="2">
            <ConditionalAlert id="key-error" message={errors.key?.message} />
            <Text size="1" color="gray">
              {autoKey ? "Auto" : "Manual"}
            </Text>
            <Button
              size="1"
              variant="soft"
              type="button"
              onClick={() => setAutoKey((v) => !v)}
            >
              {autoKey ? "Edit" : "Use auto"}
            </Button>
          </Flex>
        </Flex>
        <TextField.Root
          id="key"
          type="text"
          readOnly={autoKey}
          {...register("key", { onBlur: handleKeyBlur })}
          {...a11yProps("key-error", !!errors.key)}
        />
      </Box>

      <Flex gap="4">
        <Box flexBasis={"50%"} minWidth="180px">
          <Flex justify="between" align="baseline" mb="1">
            <Label.Root htmlFor="trait-set-id">Trait Set</Label.Root>
            <ConditionalAlert
              id="trait-set-error"
              message={errors.traitSetId?.message && "Select a trait set"}
            />
          </Flex>

          <Controller
            name="traitSetId"
            control={control}
            render={({ field }) => (
              <SelectCombobox.Root
                id="trait-set-id"
                value={traitSetSelected}
                onValueChange={(opt) =>
                  field.onChange(opt ? Number(opt.id) : undefined)
                }
                onQueryChange={setTraitSetQuery}
                options={traitSetOptions}
              >
                <SelectCombobox.Trigger placeholder="Select a trait set" />
                <SelectCombobox.Content maxWidth="300px">
                  <SelectCombobox.Input placeholder="Search trait sets..." />
                  <SelectCombobox.List>
                    {traitSetOptions.map((opt, i) => (
                      <SelectCombobox.Item
                        key={opt.id}
                        option={opt}
                        index={i}
                      />
                    ))}
                  </SelectCombobox.List>
                </SelectCombobox.Content>
              </SelectCombobox.Root>
            )}
          />
        </Box>

        <Box flexBasis={"50%"} minWidth="180px">
          <Flex justify="between" align="baseline" mb="1">
            <Label.Root htmlFor="group-id">Group</Label.Root>
            <ConditionalAlert
              id="group-error"
              message={errors.groupId?.message && "Select a group"}
            />
          </Flex>

          <Controller
            name="groupId"
            control={control}
            render={({ field }) => (
              <SelectCombobox.Root
                id="group-id"
                value={groupSelected}
                onValueChange={(opt) =>
                  field.onChange(opt ? Number(opt.id) : undefined)
                }
                onQueryChange={setGroupQuery}
                options={groupOptions}
              >
                <SelectCombobox.Trigger placeholder="Select a group" />
                <SelectCombobox.Content>
                  <SelectCombobox.Input placeholder="Search groups..." />
                  <SelectCombobox.List>
                    {groupOptions.map((opt, i) => (
                      <SelectCombobox.Item
                        key={opt.id}
                        option={opt}
                        index={i}
                      />
                    ))}
                  </SelectCombobox.List>
                </SelectCombobox.Content>
              </SelectCombobox.Root>
            )}
          />
        </Box>
      </Flex>

      <Box>
        <Flex justify="between" align="baseline" mb="1">
          <Label.Root htmlFor="description">Description</Label.Root>
          <ConditionalAlert
            id="description-error"
            message={errors.description?.message}
          />
        </Flex>
        <TextArea
          id="description"
          placeholder="Optional description for this character"
          {...register("description")}
          {...a11yProps("description-error", !!errors.description)}
        />
      </Box>

      <Box>
        <Flex gap="2" align="center">
          <Controller
            name="isMultiSelect"
            control={control}
            render={({ field }) => (
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                id="is-multi-select"
              />
            )}
          />
          <Label.Root htmlFor="is-multi-select">
            Allow multiple selections
          </Label.Root>
        </Flex>
      </Box>
    </Flex>
  );
}
