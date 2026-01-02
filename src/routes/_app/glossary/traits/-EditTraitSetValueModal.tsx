import NiceModal from "@ebay/nice-modal-react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Dialog,
  Flex,
  SegmentedControl,
  Text,
  TextArea,
  TextField,
  Tooltip,
} from "@radix-ui/themes";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Label } from "radix-ui";
import { useEffect, useMemo, useState } from "react";
import {
  Controller,
  FieldErrors,
  FormProvider,
  useForm,
  useWatch,
} from "react-hook-form";
import z from "zod";
import { ClearableColorField } from "../../../../components/inputs/ClearableColorField";
import { SelectCombobox } from "../../../../components/inputs/combobox/SelectCombobox";
import { ComboboxOption } from "../../../../components/inputs/combobox/types";
import {
  a11yProps,
  ConditionalAlert,
} from "../../../../components/inputs/ConditionalAlert";
import { updateTraitValueFn } from "../../../../lib/api/traits/updateTraitValueFn";
import { TraitValueDTO } from "../../../../lib/domain/traits/types";
import { useAutoKey } from "../../../../lib/hooks/useAutoKey";
import { traitSetValuesPaginatedQueryOptions } from "../../../../lib/queries/traits";
import { toast } from "../../../../lib/utils/toast";
import {
  trimmed,
  trimmedNonEmpty,
} from "../../../../lib/validation/trimmedOptional";

interface Props {
  traitValue: TraitValueDTO;
  invalidate: () => Promise<void>;
}

type FormValues = z.infer<typeof formSchema>;

const base = z.object({
  key: trimmedNonEmpty("Please provide a key.", {
    max: { value: 100, message: "Max 100 characters" },
  }),
  label: trimmedNonEmpty("Please provide a label.", {
    max: { value: 200, message: "Max 200 characters" },
  }),
});

const canonicalSchema = base.extend({
  kind: z.literal("canon"),
  description: trimmed("Must be a string").max(1000, "Max 1000 characters"),
  hexCode: z
    .string("Must be a string")
    .trim()
    .refine((v) => v === "" || /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(v), {
      message: "Must be a valid hex color code",
    }),
});

const aliasSchema = base.extend({
  kind: z.literal("alias"),
  aliasTarget: z
    .object({ id: z.int().positive(), label: z.string() })
    .nullable(),
});

const formSchema = z
  .discriminatedUnion("kind", [canonicalSchema, aliasSchema])
  // Refine to ensure alias set (to prevent type errors in form-in-progress)
  .superRefine((val, ctx) => {
    if (val.kind === "alias" && val.aliasTarget === null) {
      ctx.addIssue({
        code: "custom",
        path: ["aliasTarget"],
        message: "Select a canonical value.",
      });
    }
  });

const seedFormValues = (value: TraitValueDTO): FormValues => {
  if (value.aliasTarget) {
    return {
      kind: "alias",
      key: value.key,
      label: value.label,
      aliasTarget: {
        id: value.aliasTarget.id,
        label: value.aliasTarget.label,
      },
    };
  }
  return {
    kind: "canon",
    key: value.key,
    label: value.label,
    description: value.description ?? "",
    hexCode: value.hexCode ?? "",
  };
};

export const EditTraitSetValueModal = NiceModal.create<Props>(
  ({ traitValue, invalidate }) => {
    const { visible, hide } = NiceModal.useModal();
    const serverUpdate = useServerFn(updateTraitValueFn);

    const methods = useForm<FormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: seedFormValues(traitValue),
    });

    const {
      control,
      formState: { isSubmitted, touchedFields, errors },
      setValue,
      setError,
      register,
      reset,
      handleSubmit,
    } = methods;

    const canonErrors = getErrorsByKind(errors, "canon");
    const aliasErrors = getErrorsByKind(errors, "alias");
    const label = useWatch({ control, name: "label" });
    const kind = useWatch({ control, name: "kind" });

    const { autoKey, setAutoKey, handleKeyBlur } = useAutoKey(
      control,
      setValue,
      "label",
      "key"
    );

    const mutation = useMutation({
      mutationFn: serverUpdate,
      onSuccess: async (res) => {
        await invalidate();
        toast({
          variant: "success",
          description: `Trait value "${res.label}" updated successfully.`,
        });
        hide();
      },
      onError: (err) => {
        setError("root", {
          type: "server",
          message: err.message ?? "Failed to update trait value.",
        });
      },
    });

    const onSubmit = async () => {
      const raw = methods.getValues();

      // Validate using Zod directly to avoid any weirdness from unregistered fields timing
      const data = formSchema.parse(raw);

      if (data.kind === "alias") {
        await mutation.mutateAsync({
          data: {
            id: traitValue.id,
            setId: traitValue.setId,
            key: data.key,
            label: data.label,
            aliasTargetId: data.aliasTarget!.id,
          },
        });
        return;
      }

      await mutation.mutateAsync({
        data: {
          id: traitValue.id,
          setId: traitValue.setId,
          key: data.key,
          label: data.label,
          aliasTargetId: null,
          description: data.description,
          hexCode: data.hexCode === "" ? null : data.hexCode,
        },
      });
    };

    // Alias combobox state
    const [aliasQuery, setAliasQuery] = useState("");
    const { data: canonicalResp, isFetching: canonicalLoading } = useQuery(
      traitSetValuesPaginatedQueryOptions(traitValue.setId, 1, 20, {
        kind: "canonical",
        q: aliasQuery,
      })
    );
    const canonicalOptions: ComboboxOption[] = useMemo(() => {
      const items = canonicalResp?.items ?? [];
      return items
        .filter((v) => v.id !== traitValue.id)
        .map((v) => ({
          id: v.id,
          label: v.label,
          hint: v.key,
        }));
    }, [canonicalResp, traitValue.id]);

    // Derived values for blocking aliasing if value has dependents
    const aliasBlocked = traitValue.aliasCount > 0 && !traitValue.aliasTarget;
    const aliasBlockedMsg = `Cannot make "${label}" an alias because ${traitValue.aliasCount} alias value(s) depend on it.`;

    const setKindAtomic = (next: FormValues["kind"]) => {
      const { key, label } = methods.getValues();
      const nextValues: FormValues =
        next === "canon"
          ? { kind: "canon", key, label, description: "", hexCode: "" }
          : { kind: "alias", key, label, aliasTarget: null };

      reset(nextValues, {
        keepDirty: true,
        keepTouched: true,
        keepErrors: false,
      });
    };

    // Reset form when opened
    useEffect(() => {
      if (!visible) return;
      reset(seedFormValues(traitValue));
      setAutoKey(true);
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      setAliasQuery("");
      mutation.reset();
    }, [visible, traitValue, reset]);

    return (
      <Dialog.Root
        open={visible}
        onOpenChange={(open) => {
          if (!open) {
            hide();
          }
        }}
      >
        <Dialog.Content maxWidth="450px">
          <Dialog.Title>Edit {traitValue.label}</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Edit the details of the trait value.
          </Dialog.Description>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              {errors.root?.message ? (
                <Box mb="4">
                  <Text size="2" color="tomato">
                    {errors.root.message}
                  </Text>
                </Box>
              ) : null}
              <Flex direction="column" gap="3" mb="4">
                <Box>
                  <Flex justify="between" align="baseline" mb="1">
                    <Label.Root htmlFor="label">Label</Label.Root>
                    <ConditionalAlert
                      id="label-error"
                      message={
                        touchedFields.label || isSubmitted
                          ? errors.label?.message
                          : undefined
                      }
                    />
                  </Flex>
                  <TextField.Root
                    id="label"
                    placeholder="e.g. cap, stem, leaf"
                    {...register("label")}
                    {...a11yProps("label-error", !!errors.label)}
                  />
                </Box>
                <Box>
                  <Flex justify="between" align="baseline" mb="1">
                    <Label.Root htmlFor="key">Key</Label.Root>
                    <Flex align="center" gap="2">
                      <ConditionalAlert
                        id="key-error"
                        message={errors.key?.message}
                      />
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
                    {...register("key", {
                      onBlur: handleKeyBlur,
                    })}
                    {...a11yProps("key-error", !!errors.key)}
                  />
                </Box>
                <Box>
                  <Label.Root htmlFor="kind">Kind</Label.Root>
                  <Controller
                    control={control}
                    name="kind"
                    render={({ field }) => (
                      <SegmentedControl.Root
                        value={field.value}
                        onValueChange={(next) => {
                          if (next === "alias" && aliasBlocked) return;
                          setKindAtomic(next as FormValues["kind"]);
                        }}
                      >
                        <SegmentedControl.Item value="canon">
                          Canonical
                        </SegmentedControl.Item>
                        {aliasBlocked ? (
                          <Tooltip content={aliasBlockedMsg}>
                            <SegmentedControl.Item
                              value="alias"
                              aria-disabled
                              style={{
                                cursor: "not-allowed",
                                color: "var(--gray-a8)",
                              }}
                            >
                              Alias
                            </SegmentedControl.Item>
                          </Tooltip>
                        ) : (
                          <SegmentedControl.Item value="alias">
                            Alias
                          </SegmentedControl.Item>
                        )}
                      </SegmentedControl.Root>
                    )}
                  />
                </Box>
                {kind === "alias" ? (
                  <Box>
                    <Flex justify="between" align="baseline" mb="1">
                      <Label.Root htmlFor="alias-target">
                        Alias target
                      </Label.Root>
                      <ConditionalAlert
                        id="alias-target-error"
                        message={aliasErrors.aliasTarget?.message}
                      />
                    </Flex>

                    <Controller
                      name="aliasTarget"
                      control={control}
                      render={({ field }) => (
                        <SelectCombobox.Root
                          id="alias-target"
                          value={field.value}
                          onValueChange={(opt) =>
                            field.onChange(
                              opt
                                ? { id: Number(opt.id), label: opt.label }
                                : null
                            )
                          }
                          onQueryChange={setAliasQuery}
                          options={canonicalOptions}
                          loading={canonicalLoading}
                          disabled={mutation.isPending}
                        >
                          <SelectCombobox.Trigger placeholder="Select a canonical value" />
                          <SelectCombobox.Content
                            behavior="input"
                            maxWidth="400px"
                          >
                            <SelectCombobox.Input placeholder="Search canonical values..." />
                            <SelectCombobox.List>
                              {canonicalOptions.map((opt, i) => (
                                <SelectCombobox.Item
                                  key={String(opt.id)}
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
                ) : (
                  <>
                    <Box>
                      <ClearableColorField
                        name="hexCode"
                        label="Color"
                        disabled={mutation.isPending}
                      />
                    </Box>

                    <Box>
                      <Flex justify="between" align="baseline" mb="1">
                        <Label.Root htmlFor="description">
                          Description
                        </Label.Root>
                        <ConditionalAlert
                          id="description-error"
                          message={canonErrors.description?.message}
                        />
                      </Flex>
                      <TextArea
                        id="description"
                        {...register("description")}
                        {...a11yProps(
                          "description-error",
                          !!canonErrors.description
                        )}
                      />
                    </Box>
                  </>
                )}
              </Flex>
              <Flex justify="end" gap="3">
                <Dialog.Close>
                  <Button
                    type="button"
                    disabled={mutation.isPending}
                    loading={mutation.isPending}
                    variant="soft"
                    color="gray"
                  >
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  loading={mutation.isPending}
                >
                  Save
                </Button>
              </Flex>
            </form>
          </FormProvider>
        </Dialog.Content>
      </Dialog.Root>
    );
  }
);

function getErrorsByKind<K extends FormValues["kind"]>(
  errors: FieldErrors<FormValues>,
  _kind: K
): FieldErrors<Extract<FormValues, { kind: K }>> {
  void _kind;
  return errors as FieldErrors<Extract<FormValues, { kind: K }>>;
}
