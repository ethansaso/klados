import { zodResolver } from "@hookform/resolvers/zod";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Link as RadixLink,
  Select,
  Text,
  TextArea,
  TextField,
  Tooltip,
} from "@radix-ui/themes";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  notFound,
  Link as TanStackLink,
  useBlocker,
  useNavigate,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Form, Label } from "radix-ui";
import { MouseEventHandler, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { FaDove, FaLeaf } from "react-icons/fa";
import z from "zod";
import { SelectCombobox } from "../../../../../components/inputs/combobox/SelectCombobox";
import { ComboboxOption } from "../../../../../components/inputs/combobox/types";
import {
  a11yProps,
  ConditionalAlert,
} from "../../../../../components/inputs/ConditionalAlert";
import { TAXON_RANKS_DESCENDING } from "../../../../../db/schema/schema";
import { deleteTaxonFn } from "../../../../../lib/api/taxa/deleteTaxon";
import { updateTaxon } from "../../../../../lib/api/taxa/fns/update";
import { publishTaxonFn } from "../../../../../lib/api/taxa/publish";
import { nameItemSchema } from "../../../../../lib/api/taxon-names/validation";
import { TaxonCharacterStateDTO } from "../../../../../lib/domain/character-states/types";
import { TaxonDetailDTO } from "../../../../../lib/domain/taxa/types";
import {
  CharacterUpdate,
  mediaItemSchema,
  taxonPatchSchema,
} from "../../../../../lib/domain/taxa/validation";
import {
  taxaQueryOptions,
  taxonQueryOptions,
} from "../../../../../lib/queries/taxa";
import { taxonCharacterStatesQueryOptions } from "../../../../../lib/queries/taxonCharacterStates";
import { toast } from "../../../../../lib/utils/toast";
import { CharacterEditingForm } from "./-characters/CharactersEditingForm";
import { characterStateFormSchema } from "./-characters/validation";
import { pickGBIFTaxon } from "./-dialogs/GbifIdModal";
import { pickInatTaxon } from "./-dialogs/InatIdModal";
import { MediaEditingForm } from "./-MediaEditingForm";
import { NameEditingForm } from "./-names/NameEditingForm";

// TODO: choose a better approach for the seeding here.
// This one is quite laggy and fragile; there should be a proper react query loading/error setup.

const taxonFormSchema = taxonPatchSchema.extend({
  source_inat_id: z.number().nullable(),
  source_gbif_id: z.number().nullable(),
  media: z.array(mediaItemSchema),
  rank: z.enum(TAXON_RANKS_DESCENDING),
  names: z.array(nameItemSchema),
  characters: z.array(characterStateFormSchema),
});

export type FormFields = z.infer<typeof taxonFormSchema>;

// TODO: suspense
export const Route = createFileRoute("/_app/taxa/$id/edit/")({
  beforeLoad: async ({ context, params }) => {
    const id = Number(params.id);
    if (isNaN(id)) {
      throw notFound();
    }

    // ! Forcibly refetch data to ensure we have the latest version to seed form
    await context.queryClient.invalidateQueries(taxonQueryOptions(id));
    await context.queryClient.invalidateQueries(
      taxonCharacterStatesQueryOptions(id)
    );
    const taxon = await context.queryClient.fetchQuery(taxonQueryOptions(id));
    const values = await context.queryClient.fetchQuery(
      taxonCharacterStatesQueryOptions(id)
    );

    if (!taxon || !values) {
      throw notFound();
    }

    return { id, initialTaxon: taxon, initialCharacterValues: values };
  },
  loader: async ({ context, params }) => {
    const { id, initialTaxon, initialCharacterValues } = context;
    return { id, initialTaxon, initialCharacterValues };
  },
  component: RouteComponent,
});

const seedEditState = (
  taxon: TaxonDetailDTO,
  characterValues: TaxonCharacterStateDTO[]
): FormFields => ({
  parent_id: taxon.ancestors?.[taxon.ancestors.length - 1]?.id ?? null,
  rank: taxon.rank,
  source_gbif_id: taxon.sourceGbifId,
  source_inat_id: taxon.sourceInatId,
  media: taxon.media,
  notes: taxon.notes,
  names: taxon.names,
  characters: characterValues,
});

const convertToServerCharacterValues = (
  values: FormFields["characters"]
): CharacterUpdate[] => {
  return values.map((v) => {
    switch (v.kind) {
      case "categorical":
        return {
          kind: "categorical",
          characterId: v.characterId,
          traitValueIds: v.traitValues.map((tv) => tv.id),
        };
      default:
        throw new Error(`Unsupported character state kind: ${v.kind}`);
    }
  });
};

function RouteComponent() {
  const { id, initialTaxon, initialCharacterValues } = Route.useLoaderData();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const serverUpdate = useServerFn(updateTaxon);
  const serverPublish = useServerFn(publishTaxonFn);
  const serverDelete = useServerFn(deleteTaxonFn);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FormFields>({
    resolver: zodResolver(taxonFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: seedEditState(initialTaxon, initialCharacterValues),
  });

  const [isDeleting, setIsDeleting] = useState(false);
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
  const parentIdVal = useWatch({ control, name: "parent_id" });
  const parentSelected = useMemo<ComboboxOption | null>(() => {
    if (!parentIdVal) return null;
    return parentOptions.find((o) => o.id === Number(parentIdVal)) ?? null;
  }, [parentIdVal, parentOptions]);
  // For media fetching
  const inatId = useWatch({ control, name: "source_inat_id" });

  useBlocker({
    shouldBlockFn: () =>
      isDirty && !(isSubmitting || isDeleting)
        ? !confirm("Leave without saving?")
        : false,
    enableBeforeUnload: isDirty,
  });
  // Watch rank for GBIF/iNat fetching
  const rank = useWatch({ control, name: "rank" });

  const isDraft = initialTaxon.status === "draft";
  const statusBadgeColor =
    initialTaxon.status === "active"
      ? "grass"
      : initialTaxon.status === "draft"
        ? "yellow"
        : "gray";

  async function invalidateTaxon(id: number) {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["taxon", id] }),
      qc.invalidateQueries({ queryKey: ["taxonCharacterValues", id] }),
      qc.invalidateQueries({ queryKey: ["taxa"] }),
      qc.invalidateQueries({ queryKey: ["taxonCharacterDisplayGroups", id] }),
    ]);
  }

  const handleDiscard = () => {
    if (!isDirty) return;
    if (!confirm("Discard unsaved changes?")) return;
    reset(seedEditState(initialTaxon, initialCharacterValues), {
      keepDirty: false,
    });
  };

  const onSave = handleSubmit(async (data) => {
    console.log(data);
    if (!isDirty) return;
    try {
      await serverUpdate({
        data: {
          ...data,
          id,
          characters: convertToServerCharacterValues(data.characters),
        },
      });
      reset(data, { keepDirty: false }); // keep RHF dirty tracking in sync
      await invalidateTaxon(id);
      toast({ description: "Taxon saved.", variant: "success" });
    } catch (err: any) {
      toast({
        description: err?.message ?? "Failed to save changes.",
        variant: "error",
      });
    }
  });

  const onPublish = handleSubmit(async (data) => {
    if (!isDraft) return;
    try {
      await serverUpdate({
        data: {
          ...data,
          id,
          characters: convertToServerCharacterValues(data.characters),
        },
      });
      reset(data, { keepDirty: false }); // clear dirty after persisting
      await serverPublish({ data: { id } });
      await invalidateTaxon(id);
      toast({ description: "Taxon published.", variant: "success" });
      navigate({ to: ".." });
    } catch (err: any) {
      toast({
        description: err?.message ?? "Failed to publish taxon.",
        variant: "error",
      });
    }
  });

  const handleDelete: MouseEventHandler<HTMLButtonElement> = async (e) => {
    e.preventDefault();
    if (!isDraft || isDeleting || isSubmitting) return;

    const ok = window.confirm(
      "Delete this taxon draft? This cannot be undone."
    );
    if (!ok) return;

    setIsDeleting(true);
    try {
      await serverDelete({ data: { id } });
      await invalidateTaxon(id);
      toast({
        description: `Successfully deleted taxon draft`,
        variant: "success",
      });
      navigate({ to: "/taxa/drafts" });
    } catch (err: any) {
      toast({
        description: err?.message ?? "Failed to delete taxon.",
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box>
      <Box>
        <RadixLink asChild size="2">
          <TanStackLink to="..">Back</TanStackLink>
        </RadixLink>
      </Box>
      <Text size="2">Editing details for:</Text>
      <Flex align="baseline" gap="2" mb="2">
        <Heading>{initialTaxon.acceptedName}</Heading>
        <Badge color={statusBadgeColor}>{initialTaxon.status}</Badge>
      </Flex>

      <Form.Root onSubmit={onSave}>
        <Flex direction="column" gap="3" mb="5">
          <Flex gap="4">
            {/* Rank */}
            <Box>
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
              ></Controller>
            </Box>
            {/* Parent ID (TODO) */}
            <Box>
              <Flex justify="between" align="baseline" mb="1">
                <Label.Root htmlFor="parent-id">Parent taxon</Label.Root>
                <ConditionalAlert
                  id="parent-id-error"
                  message={errors.parent_id?.message}
                />
              </Flex>

              <Controller
                control={control}
                name="parent_id"
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
                      {...a11yProps("parent-id-error", !!errors.parent_id)}
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
                  message={errors.source_gbif_id?.message}
                />
              </Flex>
              <Controller
                control={control}
                name="source_gbif_id"
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
                    {...a11yProps(
                      "source-gbif-id-error",
                      !!errors.source_gbif_id
                    )}
                  >
                    <TextField.Slot side="right" pr="3">
                      <Tooltip content="Fetch from GBIF">
                        <IconButton
                          type="button"
                          variant="ghost"
                          onClick={async () => {
                            const picked = await pickGBIFTaxon(
                              initialTaxon.acceptedName,
                              rank
                            );
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
                  message={errors.source_inat_id?.message}
                />
              </Flex>
              <Controller
                control={control}
                name="source_inat_id"
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
                    {...a11yProps(
                      "source-inat-id-error",
                      !!errors.source_inat_id
                    )}
                  >
                    <TextField.Slot side="right" pr="3">
                      <Tooltip content="Fetch from iNaturalist">
                        <IconButton
                          type="button"
                          variant="ghost"
                          onClick={async () => {
                            const picked = await pickInatTaxon(
                              initialTaxon.acceptedName,
                              rank
                            );
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
              <ConditionalAlert
                id="notes-error"
                message={errors.notes?.message}
              />
            </Flex>
            <TextArea
              id="notes"
              placeholder="Optional notes about this taxon"
              {...register("notes")}
              {...a11yProps("notes-error", !!errors.notes)}
            />
          </Box>
        </Flex>

        <Controller
          name="characters"
          control={control}
          render={({ field }) => (
            <CharacterEditingForm
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />

        {/* Media */}
        <Controller
          control={control}
          name="media"
          render={({ field: { value, onChange } }) => (
            <MediaEditingForm
              value={value}
              inatId={inatId}
              onChange={onChange}
            />
          )}
        />

        {/* Names */}
        <Controller
          control={control}
          name="names"
          render={({ field: { value, onChange } }) => (
            <NameEditingForm
              value={value}
              inatId={inatId}
              onChange={onChange}
            />
          )}
        />

        {/* TODO: fix spacing, also figure out client discriminated rendering */}
        <Flex gap="2" justify="between">
          <Flex gap="2" justify="end">
            <Button
              type="button"
              disabled={isSubmitting || isDeleting || !isDirty}
              loading={isSubmitting || isDeleting}
              onClick={handleDiscard}
              variant="soft"
            >
              Discard Changes
            </Button>
            <Button
              type="submit"
              variant={isDraft ? "soft" : "solid"}
              loading={isSubmitting || isDeleting}
              disabled={!isDirty || isSubmitting || isDeleting}
            >
              Save
            </Button>
          </Flex>
          <Flex gap="2" justify="end">
            {isDraft && (
              <>
                <Button
                  type="button"
                  disabled={isSubmitting || isDeleting}
                  loading={isSubmitting || isDeleting}
                  onClick={onPublish}
                >
                  Publish
                </Button>
                <Button
                  type="button"
                  disabled={isDeleting || isSubmitting}
                  loading={isDeleting || isSubmitting}
                  color="tomato"
                  onClick={handleDelete}
                >
                  Delete Draft
                </Button>
              </>
            )}
          </Flex>
        </Flex>
      </Form.Root>
    </Box>
  );
}
