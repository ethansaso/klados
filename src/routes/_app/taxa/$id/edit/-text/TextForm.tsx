import { Box, Flex, Heading, TextArea } from "@radix-ui/themes";
import { Label } from "radix-ui";
import { useFormContext } from "react-hook-form";
import type { TaxonEditFormValues } from "..";
import {
  a11yProps,
  ConditionalAlert,
} from "../../../../../../components/inputs/ConditionalAlert";

export const TextForm = () => {
  const {
    formState: { errors },
    register,
  } = useFormContext<TaxonEditFormValues>();

  return (
    <Flex direction="column" gap="3">
      <Box>
        <Flex justify="between" align="baseline" mb="1">
          <Heading size="3" mb="0" asChild>
            <Label.Root htmlFor="ecology">Ecology</Label.Root>
          </Heading>
          <ConditionalAlert
            id="ecology-error"
            message={errors.ecology?.message}
          />
        </Flex>
        <TextArea
          id="ecology"
          placeholder="Optional ecology about this taxon"
          {...register("ecology")}
          {...a11yProps("ecology-error", !!errors.ecology)}
        />
      </Box>
      <Box>
        <Flex justify="between" align="baseline" mb="1">
          <Heading size="3" mb="0" asChild>
            <Label.Root htmlFor="notes">Notes</Label.Root>
          </Heading>
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
