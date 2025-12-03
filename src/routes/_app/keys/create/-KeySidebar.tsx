import { Box, Button, Flex, Heading } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Label } from "radix-ui";
import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { SelectCombobox } from "../../../../components/inputs/combobox/SelectCombobox";
import { ComboboxOption } from "../../../../components/inputs/combobox/types";
import {
  a11yProps,
  ConditionalAlert,
} from "../../../../components/inputs/ConditionalAlert";
import { DEFAULT_KEYGEN_OPTIONS } from "../../../../keygen/options";
import { generateKeyFn } from "../../../../lib/api/keygen/generateKey";
import { taxaQueryOptions } from "../../../../lib/queries/taxa";
import { toast } from "../../../../lib/utils/toast";
import { useKeyEditorStore } from "./-store-data/useKeyEditorStore";

interface KeyGeneratorInput {
  taxonId: number;
}

export const KeySidebar = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<KeyGeneratorInput>();
  const [taxonQ, setTaxonQ] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const serverGenerateKeyFn = useServerFn(generateKeyFn);
  const loadKey = useKeyEditorStore((s) => s.loadKey);

  const { data: taxaResp } = useQuery(
    taxaQueryOptions(1, 10, { q: taxonQ, status: "active" })
  );
  const taxaOptions = useMemo<ComboboxOption[]>(() => {
    const items = taxaResp?.items ?? [];
    return items.reduce<ComboboxOption[]>((acc, i) => {
      acc.push({
        id: i.id,
        label: i.acceptedName,
        hint: i.rank,
      });
      return acc;
    }, []);
  }, [taxaResp]);
  const taxonIdVal = useWatch({ control, name: "taxonId" });
  const taxonSelected = useMemo<ComboboxOption | null>(() => {
    if (!taxonIdVal) return null;
    return taxaOptions.find((o) => o.id === Number(taxonIdVal)) ?? null;
  }, [taxonIdVal, taxaOptions]);

  const onSubmit = async () => {
    if (!taxonIdVal) return;

    setIsSubmitting(true);

    try {
      const result = await serverGenerateKeyFn({
        data: { taxonId: taxonIdVal, options: DEFAULT_KEYGEN_OPTIONS },
      });

      // assuming result has shape { rootNode: KeyTaxonNode }
      if (!result?.rootNode) {
        throw new Error("No rootNode returned from keygen");
      }

      loadKey(result.rootNode);
    } catch (err: any) {
      console.error("Key generation failed:", err);
      toast({
        variant: "error",
        description:
          err?.message ?? "Something went wrong while generating the key.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside className="key-sidebar">
      <form className="key-sidebar__form" onSubmit={handleSubmit(onSubmit)}>
        <section>
          <Heading size="3" mb="4">
            Key Sidebar
          </Heading>

          <Box>
            <Flex justify="between" align="baseline" mb="1">
              <Label.Root htmlFor="taxon-id">Root Taxon</Label.Root>
              <ConditionalAlert
                id="taxon-id-error"
                message={errors.taxonId?.message}
              />
            </Flex>
            <Controller
              control={control}
              name="taxonId"
              render={({ field }) => (
                <SelectCombobox.Root
                  id="taxon-id"
                  value={taxonSelected}
                  onValueChange={(opt) => {
                    field.onChange(opt ? Number(opt.id) : null);
                  }}
                  options={taxaOptions}
                  onQueryChange={setTaxonQ}
                >
                  <SelectCombobox.Trigger
                    placeholder="Select root taxon..."
                    {...a11yProps("taxon-id-error", !!errors.taxonId)}
                  />
                  <SelectCombobox.Content>
                    <SelectCombobox.Input />
                    <SelectCombobox.List>
                      {taxaOptions.map((option, index) => (
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
        </section>
        <section>
          <Button
            type="submit"
            disabled={!taxonIdVal || isSubmitting}
            loading={isSubmitting}
          >
            Generate Key
          </Button>
        </section>
      </form>
    </aside>
  );
};
