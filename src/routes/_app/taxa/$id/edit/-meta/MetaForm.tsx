import {
  Box,
  Flex,
  Heading,
  IconButton,
  Select,
  TextField,
} from "@radix-ui/themes";
import { Label } from "radix-ui";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { FaDove, FaLeaf } from "react-icons/fa";
import type { TaxonEditFormValues } from "..";
import { TAXON_RANKS_DESCENDING } from "../../../../../../../db/schema/schema";
import {
  a11yProps,
  ConditionalAlert,
} from "../../../../../../components/inputs/ConditionalAlert";
import { ResponsiveTooltip } from "../../../../../../components/ResponsiveTooltip";
import type { LeanTaxonDTO } from "../../../../../../lib/domain/taxa/types";
import { ParentTaxonCombobox } from "../../../-components/ParentTaxonCombobox";
import { pickGBIFTaxon } from "./GbifIdModal";
import { pickInatTaxon } from "./InatIdModal";

interface MetaFormProps {
  id: number;
  acceptedName: string;
  initialParent: LeanTaxonDTO | null;
}

export const MetaForm = ({
  id,
  acceptedName,
  initialParent,
}: MetaFormProps) => {
  const {
    control,
    formState: { errors },
  } = useFormContext<TaxonEditFormValues>();

  const rank = useWatch({ control, name: "rank" });

  return (
    <Box>
      <Heading size="3" mb="2">
        Basic Information
      </Heading>
      <Flex direction="column" gap="3">
        <Flex gap="4">
          {/* Rank */}
          <Box flexGrow="1" flexShrink="1" flexBasis="0">
            <Flex justify="between" align="baseline" mb="1">
              <Label.Root htmlFor="rank">Rank</Label.Root>
              <ConditionalAlert
                id="rank-error"
                message={errors.rank?.message}
              />
            </Flex>
            <Controller
              name="rank"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Select.Root
                  value={value}
                  onValueChange={(v) => onChange(v as typeof value)}
                >
                  <Select.Trigger style={{ width: "100%" }}>
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
          <Box flexGrow="1" flexShrink="1" flexBasis="0">
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
                <ParentTaxonCombobox
                  id="parent-id"
                  value={field.value}
                  onChange={field.onChange}
                  excludeId={id}
                  initialParent={initialParent}
                  invalid={!!errors.parentId}
                />
              )}
            />
          </Box>
        </Flex>
        <Flex gap="4">
          {/* Source GBIF ID */}
          <Box>
            <Flex justify="between" align="baseline" mb="1">
              <Label.Root htmlFor="source-gbif-id">GBIF ID</Label.Root>
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
                        : Number(e.currentTarget.value),
                    )
                  }
                  onBlur={field.onBlur}
                  {...a11yProps("source-gbif-id-error", !!errors.sourceGbifId)}
                >
                  <TextField.Slot side="right" pr="3">
                    <ResponsiveTooltip content="Fetch from GBIF">
                      <IconButton
                        type="button"
                        variant="ghost"
                        onClick={async () => {
                          const picked = await pickGBIFTaxon(
                            acceptedName,
                            rank,
                          );
                          if (picked) field.onChange(picked.id);
                        }}
                      >
                        <FaLeaf />
                      </IconButton>
                    </ResponsiveTooltip>
                  </TextField.Slot>
                </TextField.Root>
              )}
            />
          </Box>
          {/* Source iNat ID */}
          <Box>
            <Flex justify="between" align="baseline" mb="1">
              <Label.Root htmlFor="source-inat-id">iNaturalist ID</Label.Root>
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
                        : Number(e.currentTarget.value),
                    )
                  }
                  onBlur={field.onBlur}
                  {...a11yProps("source-inat-id-error", !!errors.sourceInatId)}
                >
                  <TextField.Slot side="right" pr="3">
                    <ResponsiveTooltip content="Fetch from iNaturalist">
                      <IconButton
                        type="button"
                        variant="ghost"
                        onClick={async () => {
                          const picked = await pickInatTaxon(
                            acceptedName,
                            rank,
                          );
                          if (picked) field.onChange(picked.id);
                        }}
                      >
                        <FaDove />
                      </IconButton>
                    </ResponsiveTooltip>
                  </TextField.Slot>
                </TextField.Root>
              )}
            />
          </Box>
        </Flex>
      </Flex>
    </Box>
  );
};
