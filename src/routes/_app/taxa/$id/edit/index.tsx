import { zodResolver } from "@hookform/resolvers/zod";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Link as RadixLink,
  Text,
} from "@radix-ui/themes";
import { useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  notFound,
  Link as TanStackLink,
  useBlocker,
  useNavigate,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Form } from "radix-ui";
import { MouseEventHandler, useState } from "react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import z from "zod";
import { TAXON_RANKS_DESCENDING } from "../../../../../db/schema/schema";
import { getTaxonCharacterStatesFn } from "../../../../../lib/api/character-states/getTaxonCharacterStates";
import { deleteTaxonFn } from "../../../../../lib/api/taxa/deleteTaxonFn";
import { getTaxonFn } from "../../../../../lib/api/taxa/getTaxonFn";
import { publishTaxonFn } from "../../../../../lib/api/taxa/publishFn";
import { updateTaxonFn } from "../../../../../lib/api/taxa/updateTaxonFn";
import { getSourcesForTaxonFn } from "../../../../../lib/api/taxon-sources/getSourcesForTaxonFn";
import { TaxonCharacterStateDTO } from "../../../../../lib/domain/character-states/types";
import { SourceDTO } from "../../../../../lib/domain/sources/types";
import { TaxonDetailDTO } from "../../../../../lib/domain/taxa/types";
import {
  CharacterUpdate,
  mediaItemSchema,
} from "../../../../../lib/domain/taxa/validation";
import { nameItemSchema } from "../../../../../lib/domain/taxon-names/validation";
import { TaxonSourceDTO } from "../../../../../lib/domain/taxon-sources/types";
import {
  setTaxonSourcesSchema,
  TaxonSourceUpsertItem,
} from "../../../../../lib/domain/taxon-sources/validation";
import { toast } from "../../../../../lib/utils/toast";
import { CharacterEditingForm } from "./-characters/CharactersEditingForm";
import { characterStateFormSchema } from "./-characters/validation";
import { MediaEditingForm } from "./-media/MediaEditingForm";
import { MetaForm } from "./-meta/MetaForm";
import { NameEditingForm } from "./-names/NameEditingForm";
import { SourceEditingForm } from "./-sources/SourceEditingForm";

export type TaxonEditFormValues = z.infer<typeof taxonEditFormSchema>;

export const taxonEditFormSchema = z.object({
  parentId: z.number().nullable(),
  rank: z.enum(TAXON_RANKS_DESCENDING),
  sourceGbifId: z.number().nullable(),
  sourceInatId: z.number().nullable(),
  media: z.array(mediaItemSchema),
  notes: z.string(),
  names: z.array(nameItemSchema),
  characters: z.array(characterStateFormSchema),
  sources: setTaxonSourcesSchema,
});

const seedSources = (rows: TaxonSourceDTO[]): TaxonSourceUpsertItem[] =>
  rows.map((r) => ({
    sourceId: r.sourceId,
    accessedAt: new Date(r.accessedAt),
    locator: r.locator ?? "",
    note: r.note ?? "",
  }));

const seedEditState = (
  taxon: TaxonDetailDTO,
  characterValues: TaxonCharacterStateDTO[],
  sources: TaxonSourceDTO[]
): TaxonEditFormValues => ({
  parentId: taxon.ancestors?.[taxon.ancestors.length - 1]?.id ?? null,
  rank: taxon.rank,
  sourceGbifId: taxon.sourceGbifId,
  sourceInatId: taxon.sourceInatId,
  media: taxon.media,
  notes: taxon.notes,
  names: taxon.names,
  characters: characterValues,
  sources: seedSources(sources),
});

const convertToServerCharacterValues = (
  values: TaxonEditFormValues["characters"]
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

export const Route = createFileRoute("/_app/taxa/$id/edit/")({
  beforeLoad: async ({ params }) => {
    const id = Number(params.id);
    if (isNaN(id)) {
      throw notFound();
    }

    const [taxon, values, sources] = await Promise.all([
      getTaxonFn({ data: { id } }),
      getTaxonCharacterStatesFn({ data: { taxonId: id } }),
      getSourcesForTaxonFn({ data: { id } }),
    ]);

    if (!taxon || !values || !sources) {
      throw notFound();
    }

    return {
      id,
      initialTaxon: taxon,
      initialCharacterValues: values,
      initialSources: sources,
    };
  },
  loader: async ({ context }) => {
    const { id, initialTaxon, initialCharacterValues, initialSources } =
      context;
    return { id, initialTaxon, initialCharacterValues, initialSources };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { id, initialTaxon, initialCharacterValues, initialSources } =
    Route.useLoaderData();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const serverUpdate = useServerFn(updateTaxonFn);
  const serverPublish = useServerFn(publishTaxonFn);
  const serverDelete = useServerFn(deleteTaxonFn);

  const methods = useForm({
    resolver: zodResolver(taxonEditFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: seedEditState(
      initialTaxon,
      initialCharacterValues,
      initialSources
    ),
  });
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = methods;

  const [isDeleting, setIsDeleting] = useState(false);
  // For media fetching
  const inatId = useWatch({ control, name: "sourceInatId" });

  // Visual mapping for sources editing
  const [sourcesById, setSourcesById] = useState<Map<number, SourceDTO>>(() => {
    const m = new Map<number, SourceDTO>();
    for (const row of initialSources) m.set(row.sourceId, row.source);
    return m;
  });

  useBlocker({
    shouldBlockFn: () =>
      isDirty && !(isSubmitting || isDeleting)
        ? !confirm("Leave without saving?")
        : false,
    enableBeforeUnload: isDirty,
  });

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
    reset(seedEditState(initialTaxon, initialCharacterValues, initialSources), {
      keepDirty: false,
    });
  };

  const onSave = handleSubmit(async (data) => {
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
    } catch (err: Error) {
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

      <FormProvider {...methods}>
        <Form.Root onSubmit={onSave}>
          {/* TODO: sync accepted name */}
          {/* Basic meta (rank, parent, source IDs) */}
          <MetaForm id={id} acceptedName={initialTaxon.acceptedName} />

          {/* Characters */}
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

          {/* Sources */}
          <Controller
            control={control}
            name="sources"
            render={({ field: { value, onChange } }) => (
              <SourceEditingForm
                value={value}
                sourcesById={sourcesById}
                setSourcesById={setSourcesById}
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
      </FormProvider>
    </Box>
  );
}
