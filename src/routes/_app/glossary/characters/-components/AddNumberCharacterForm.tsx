import { Box, Flex } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { Label } from "radix-ui";
import { useMemo, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { ConditionalAlert } from "../../../../../components/inputs/ConditionalAlert";
import { SelectCombobox } from "../../../../../components/inputs/combobox/SelectCombobox";
import type { ComboboxOption } from "../../../../../components/inputs/combobox/types";
import type { CreateCharacterInput } from "../../../../../lib/domain/characters/validation";
import { unitFamiliesQueryOptions } from "../../../../../lib/queries/units";

type CreateNumberCharacterInput = Extract<
  CreateCharacterInput,
  { type: "number" }
>;

export const AddNumberCharacterForm = () => {
  const {
    control,
    formState: { errors },
  } = useFormContext<CreateNumberCharacterInput>();

  const [unitFamilyQuery, setUnitFamilyQuery] = useState("");

  const { data: unitFamilyResp } = useQuery(
    unitFamiliesQueryOptions(unitFamilyQuery),
  );

  const unitFamilyOptions = (unitFamilyResp?.map((i) => ({
    id: i.id,
    label: i.label,
    hint:
      i.units
        .slice(0, 2)
        .map((u) => u.symbol)
        .join(", ") + (i.units.length > 2 ? ", ..." : ""),
  })) ?? []) as ComboboxOption[];

  const unitFamilyIdVal = useWatch({ control, name: "unitFamilyId" });

  const unitFamilySelected = useMemo<ComboboxOption | null>(() => {
    if (!unitFamilyIdVal) return null;
    return (
      unitFamilyOptions.find((o) => o.id === Number(unitFamilyIdVal)) ?? null
    );
  }, [unitFamilyIdVal, unitFamilyOptions]);

  return (
    <Box>
      <Flex justify="between" align="baseline" mb="1">
        <Label.Root htmlFor="unit-family-id">Unit Family</Label.Root>
        <ConditionalAlert
          id="unit-family-error"
          message={errors.unitFamilyId?.message && "Select a unit family"}
        />
      </Flex>

      <Controller
        name="unitFamilyId"
        control={control}
        render={({ field }) => (
          <SelectCombobox.Root
            id="unit-family-id"
            value={unitFamilySelected}
            onValueChange={(opt) =>
              field.onChange(opt ? Number(opt.id) : undefined)
            }
            onQueryChange={setUnitFamilyQuery}
            options={unitFamilyOptions}
          >
            <SelectCombobox.Trigger placeholder="Select a unit family" />
            <SelectCombobox.Content maxWidth="300px">
              <SelectCombobox.Input placeholder="Search unit families..." />
              <SelectCombobox.List>
                {unitFamilyOptions.map((opt, i) => (
                  <SelectCombobox.Item key={opt.id} option={opt} index={i} />
                ))}
              </SelectCombobox.List>
            </SelectCombobox.Content>
          </SelectCombobox.Root>
        )}
      />
    </Box>
  );
};
