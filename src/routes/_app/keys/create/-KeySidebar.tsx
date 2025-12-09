import { Box, Button, Card, Flex, Heading } from "@radix-ui/themes";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Label } from "radix-ui";
import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useShallow } from "zustand/react/shallow";
import { SelectCombobox } from "../../../../components/inputs/combobox/SelectCombobox";
import { ComboboxOption } from "../../../../components/inputs/combobox/types";
import {
  a11yProps,
  ConditionalAlert,
} from "../../../../components/inputs/ConditionalAlert";
import { useKeyEditorStore } from "../../../../components/react-flow-keys/data/useKeyEditorStore";
import { generateKeyFn } from "../../../../lib/api/keys/generateKey";
import { saveKeyFn } from "../../../../lib/api/keys/saveKey";
import { taxaQueryOptions } from "../../../../lib/queries/taxa";
import { toast } from "../../../../lib/utils/toast";

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
  const serverSaveKeyFn = useServerFn(saveKeyFn);

  // editor store hooks
  const initFromGeneratedKey = useKeyEditorStore((s) => s.initFromGeneratedKey);
  const updateMeta = useKeyEditorStore((s) => s.updateMeta);
  const markSaved = useKeyEditorStore((s) => s.markSaved);
  // grab meta
  const { keyId, rootNode, name, description, dirty } = useKeyEditorStore(
    useShallow((s) => ({
      keyId: s.keyId,
      rootNode: s.rootNode,
      name: s.name,
      description: s.description,
      dirty: s.dirty,
    }))
  );

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

  const handleGenerateKey = async () => {
    if (!taxonIdVal) return;

    setIsSubmitting(true);

    try {
      const result = await serverGenerateKeyFn({
        data: { taxonId: taxonIdVal, options: {} },
      });

      if (!result?.rootNode) {
        throw new Error("No rootNode returned from keygen");
      }

      // 1) initialize the editor store with the generated tree
      initFromGeneratedKey({ rootNode: result.rootNode });

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

  const { mutate: saveKey, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      if (!rootNode) {
        throw new Error("No key to save. Generate a key first.");
      }

      const payload = {
        id: keyId ?? undefined,
        rootTaxonId: rootNode.id,
        name: name || "Untitled",
        description: description ?? "",
        rootNode,
      };

      return serverSaveKeyFn({ data: payload });
    },
    onSuccess: (res) => {
      if (res?.id != null) {
        markSaved(res.id);
      } else {
        markSaved();
      }
      toast({
        variant: "success",
        description: "Key saved.",
      });
    },
    onError: (err) => {
      console.error("Key save failed:", err);
      toast({
        variant: "error",
        description:
          err?.message ?? "Something went wrong while saving the key.",
      });
    },
  });

  const canSave = !!rootNode && dirty && !isSaving;

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
          <Flex asChild justify="between">
            <section>
              <Button
                type="submit"
                disabled={!taxonIdVal || isSubmitting}
                loading={isSubmitting}
              >
                Generate Key
              </Button>
              <Button
                type="button"
                disabled={!canSave}
                loading={isSaving}
                onClick={() => saveKey()}
              >
                Save Key
              </Button>
            </section>
          </Flex>
        </form>
      </aside>
    </Card>
  );
};
