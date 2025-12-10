import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Select,
  TextField,
} from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Label } from "radix-ui";
import { useMemo, useState } from "react";
import { Controller, SubmitHandler, useForm, useWatch } from "react-hook-form";
import { SelectCombobox } from "../../../../components/inputs/combobox/SelectCombobox";
import { ComboboxOption } from "../../../../components/inputs/combobox/types";
import {
  a11yProps,
  ConditionalAlert,
} from "../../../../components/inputs/ConditionalAlert";
import { useKeyEditorStore } from "../../../../components/react-flow-keys/data/useKeyEditorStore";
import {
  KeyGenerationInput,
  KeyGenerationInputSchema,
} from "../../../../keygen/ioTypes";
import { generateKeyFn } from "../../../../lib/api/keys/generateKey";
import { taxaQueryOptions } from "../../../../lib/queries/taxa";
import { capitalizeFirstLetter } from "../../../../lib/utils/casing";
import { toast } from "../../../../lib/utils/toast";

export const KeySidebar = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(KeyGenerationInputSchema),
    defaultValues: {
      options: {
        keyShape: "balanced",
        maxBranches: 5,
      },
    },
  });
  const [taxonQ, setTaxonQ] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const serverGenerateKeyFn = useServerFn(generateKeyFn);

  // editor store hooks
  const initFromGeneratedKey = useKeyEditorStore((s) => s.initFromGeneratedKey);
  const updateMeta = useKeyEditorStore((s) => s.updateMeta);

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

  const handleGenerateKey: SubmitHandler<KeyGenerationInput> = async (data) => {
    if (!taxonIdVal) return;

    setIsSubmitting(true);

    try {
      const result = await serverGenerateKeyFn({
        data,
      });

      if (!result || !result.graph) {
        throw new Error("No graph returned from keygen");
      }

      // 1) initialize the editor store with the generated graph
      initFromGeneratedKey({ graph: result.graph });

      // 2) set default metadata for new keys
      updateMeta({ name: "Untitled", description: "" });
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
    <Card asChild>
      <aside className="key-sidebar">
        <form
          className="key-sidebar__form"
          onSubmit={handleSubmit(handleGenerateKey)}
        >
          <section>
            <Heading size="3" mb="4">
              Key Editor
            </Heading>

            <Box mb="3">
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

            <Box mb="3">
              <Flex justify="between" align="baseline" mb="1">
                <Label.Root htmlFor="options.keyShape">Key Shape</Label.Root>
                <ConditionalAlert
                  id="options.keyShape-error"
                  message={errors.options?.keyShape?.message}
                />
              </Flex>
              <Controller
                name="options.keyShape"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Select.Root
                    value={value}
                    onValueChange={(v) => onChange(v as typeof value)}
                  >
                    <Select.Trigger id="options.keyShape">
                      {capitalizeFirstLetter(value!)}
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="balanced">Balanced</Select.Item>
                      <Select.Item value="lopsided">Lopsided</Select.Item>
                    </Select.Content>
                  </Select.Root>
                )}
              />
            </Box>
            <Box mb="3">
              <Flex justify="between" align="baseline" mb="1">
                <Label.Root htmlFor="options.maxBranches">
                  Max branches per couplet
                </Label.Root>
                <ConditionalAlert
                  id="options.maxBranches-error"
                  message={errors.options?.maxBranches?.message}
                />
              </Flex>
              <Controller
                name="options.maxBranches"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <TextField.Root
                    id="options.maxBranches"
                    type="number"
                    value={value}
                    onChange={onChange}
                    min={2}
                    max={10}
                    {...a11yProps(
                      "options.maxBranches-error",
                      !!errors.options?.maxBranches
                    )}
                  />
                )}
              />
            </Box>
          </section>
          <Flex asChild justify="between">
            <section>
              <Button
                type="submit"
                disabled={!taxonIdVal || isSubmitting}
                loading={isSubmitting}
              >
                Generate Key
              </Button>
            </section>
          </Flex>
        </form>
      </aside>
    </Card>
  );
};
