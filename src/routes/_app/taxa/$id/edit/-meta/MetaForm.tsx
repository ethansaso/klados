import {
  Box,
  Flex,
  IconButton,
  Select,
  TextArea,
  TextField,
  Tooltip,
} from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { Label } from "radix-ui";
import { useMemo, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { FaDove, FaLeaf } from "react-icons/fa";
import { TaxonEditFormValues } from "..";
import { SelectCombobox } from "../../../../../../components/inputs/combobox/SelectCombobox";
import { ComboboxOption } from "../../../../../../components/inputs/combobox/types";
import {
  a11yProps,
  ConditionalAlert,
} from "../../../../../../components/inputs/ConditionalAlert";
import { TAXON_RANKS_DESCENDING } from "../../../../../../db/schema/schema";
import { taxaQueryOptions } from "../../../../../../lib/queries/taxa";
import { pickGBIFTaxon } from "./GbifIdModal";
import { pickInatTaxon } from "./InatIdModal";

interface MetaFormProps {
  id: number;
  acceptedName: string;
}

export const MetaForm = ({ id, acceptedName }: MetaFormProps) => {
  const {
    control,
    formState: { errors },
    register,
  } = useFormContext<TaxonEditFormValues>();

  const rank = useWatch({ control, name: "rank" });
  const parentIdVal = useWatch({ control, name: "parentId" });

  // Parent combobox setup
  const [parentQ, setParentQ] = useState("");
  const { data: parentResp } = useQuery(
    taxaQueryOptions(1, 10, { q: parentQ, status: "active" })
  );
  const parentOptions = useMemo<ComboboxOption[]>(() => {
    const items = parentResp?.items ?? [];
    return items.reduce<ComboboxOption[]>((acc, i) => {
      if (i.id === id) return acc; // skip self
      acc.push({
        id: i.id,
        label: i.acceptedName,
        hint: i.rank,
      });
      return acc;
    }, []);
  }, [parentResp, id]);

  // Selected parent option
  const parentSelected = useMemo<ComboboxOption | null>(() => {
    if (!parentIdVal) return null;
    return parentOptions.find((o) => o.id === Number(parentIdVal)) ?? null;
  }, [parentIdVal, parentOptions]);

  return (
    <Flex direction="column" gap="3" mb="5">
      <Flex gap="4">
        {/* Rank */}
        <Box>
          <Flex justify="between" align="baseline" mb="1">
            <Label.Root htmlFor="rank">Rank</Label.Root>
            <ConditionalAlert id="rank-error" message={errors.rank?.message} />
          </Flex>
          <Controller
            name="rank"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Select.Root
                value={value}
                onValueChange={(v) => onChange(v as typeof value)}
              >
                <Select.Trigger style={{ display: "flex" }}>
                  {value}
                </Select.Trigger>
                <Select.Content>
                  {TAXON_RANKS_DESCENDING.map((rank) => (
                    <Select.Item key={rank} value={rank}>
                      {rank}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            )}
          />
        </Box>

        {/* Parent taxon */}
        <Box>
          <Flex justify="between" align="baseline" mb="1">
            <Label.Root htmlFor="parent-id">Parent taxon</Label.Root>
            <ConditionalAlert
              id="parent-id-error"
              message={errors.parentId?.message}
            />
          </Flex>

          <Controller
            control={control}
            name="parentId"
            render={({ field }) => (
              <SelectCombobox.Root
                id="parent-id"
                value={parentSelected}
                onValueChange={(opt) => {
                  field.onChange(opt ? Number(opt.id) : null);
                }}
                options={parentOptions}
                onQueryChange={setParentQ}
              >
                <SelectCombobox.Trigger
                  placeholder="Select parent taxon"
                  {...a11yProps("parent-id-error", !!errors.parentId)}
                />
                <SelectCombobox.Content>
                  <SelectCombobox.Input />
                  <SelectCombobox.List>
                    {parentOptions.map((option, index) => (
                      <SelectCombobox.Item
                        key={option.id}
                        index={index}
                        option={option}
                      />
                    ))}
                  </SelectCombobox.List>
                </SelectCombobox.Content>
              </SelectCombobox.Root>
            )}
          />
        </Box>
      </Flex>
      <Flex gap="4">
        {/* Source GBIF ID */}
        <Box>
          <Flex justify="between" align="baseline" mb="1">
            <Label.Root htmlFor="source-gbif-id">Source GBIF ID</Label.Root>
            <ConditionalAlert
              id="source-gbif-id-error"
              message={errors.sourceGbifId?.message}
            />
          </Flex>
          <Controller
            control={control}
            name="sourceGbifId"
            render={({ field }) => (
              <TextField.Root
                id="source-gbif-id"
                type="number"
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(
                    e.currentTarget.value === ""
                      ? null
                      : Number(e.currentTarget.value)
                  )
                }
                onBlur={field.onBlur}
                {...a11yProps("source-gbif-id-error", !!errors.sourceGbifId)}
              >
                <TextField.Slot side="right" pr="3">
                  <Tooltip content="Fetch from GBIF">
                    <IconButton
                      type="button"
                      variant="ghost"
                      onClick={async () => {
                        const picked = await pickGBIFTaxon(acceptedName, rank);
                        if (picked) field.onChange(picked.id);
                      }}
                    >
                      <FaLeaf />
                    </IconButton>
                  </Tooltip>
                </TextField.Slot>
              </TextField.Root>
            )}
          />
        </Box>
        {/* Source iNat ID */}
        <Box>
          <Flex justify="between" align="baseline" mb="1">
            <Label.Root htmlFor="source-inat-id">
              Source iNaturalist ID
            </Label.Root>
            <ConditionalAlert
              id="source-inat-id-error"
              message={errors.sourceInatId?.message}
            />
          </Flex>
          <Controller
            control={control}
            name="sourceInatId"
            render={({ field }) => (
              <TextField.Root
                id="source-inat-id"
                type="number"
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(
                    e.currentTarget.value === ""
                      ? null
                      : Number(e.currentTarget.value)
                  )
                }
                onBlur={field.onBlur}
                {...a11yProps("source-inat-id-error", !!errors.sourceInatId)}
              >
                <TextField.Slot side="right" pr="3">
                  <Tooltip content="Fetch from iNaturalist">
                    <IconButton
                      type="button"
                      variant="ghost"
                      onClick={async () => {
                        const picked = await pickInatTaxon(acceptedName, rank);
                        if (picked) field.onChange(picked.id);
                      }}
                    >
                      <FaDove />
                    </IconButton>
                  </Tooltip>
                </TextField.Slot>
              </TextField.Root>
            )}
          />
        </Box>
      </Flex>

      {/* Notes */}
      <Box>
        <Flex justify="between" align="baseline" mb="1">
          <Label.Root htmlFor="notes">Notes</Label.Root>
          <ConditionalAlert id="notes-error" message={errors.notes?.message} />
        </Flex>
        <TextArea
          id="notes"
          placeholder="Optional notes about this taxon"
          {...register("notes")}
          {...a11yProps("notes-error", !!errors.notes)}
        />
      </Box>
    </Flex>
  );
};
