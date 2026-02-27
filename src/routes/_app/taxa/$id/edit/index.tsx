import "../../../../../assets/styles/pages/taxa/edit.css";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Link as RadixLink,
  Separator,
  Text,
} from "@radix-ui/themes";
import { Query, useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  notFound,
  Link as TanStackLink,
  useBlocker,
  useNavigate,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Form } from "radix-ui";
import { useState, type MouseEventHandler } from "react";
import {
  Controller,
  FormProvider,
  useForm,
  useWatch,
  type SubmitHandler,
} from "react-hook-form";
import z from "zod";
import { TAXON_RANKS_DESCENDING } from "../../../../../../db/schema/schema";
import { ContentContainer } from "../../../../../components/ContentContainer";
import { getTaxonCharacterStatesFn } from "../../../../../lib/api/character-states/getTaxonCharacterStatesFn";
import { deleteTaxonFn } from "../../../../../lib/api/taxa/deleteTaxonFn";
import { getTaxonFn } from "../../../../../lib/api/taxa/getTaxonFn";
import { publishTaxonFn } from "../../../../../lib/api/taxa/publishFn";
import { updateTaxonFn } from "../../../../../lib/api/taxa/updateTaxonFn";
import { getSourcesForTaxonFn } from "../../../../../lib/api/taxon-sources/getSourcesForTaxonFn";
import type { SourceDTO } from "../../../../../lib/domain/sources/types";
import type { CharacterByFeatureUpdate } from "../../../../../lib/domain/states/validation";
import { mediaItemSchema } from "../../../../../lib/domain/taxa/validation";
import { setTaxonSourcesSchema } from "../../../../../lib/domain/taxon-sources/validation";
import { getErrorMessage } from "../../../../../lib/utils/getErrorMessage";
import { routeSeo } from "../../../../../lib/utils/head/routeSeo";
import { toast } from "../../../../../lib/utils/toast";
import { CharacterEditingForm } from "./-characters/CharactersEditingForm";
import type { GroupedCharacterFormValue } from "./-characters/validation";
import { groupedCharacterFormSchema } from "./-characters/validation";
import { MediaEditingForm } from "./-media/MediaEditingForm";
import { MetaForm } from "./-meta/MetaForm";
import { NameEditingForm } from "./-names/NameEditingForm";
import { nameItemFormSchema } from "./-names/validation";
import { seedTaxonEditState } from "./-seeding";
import { SourceEditingForm } from "./-sources/SourceEditingForm";

export type TaxonEditFormValues = z.infer<typeof taxonEditFormSchema>;
export const taxonEditFormSchema = z.object({
  parentId: z.number().nullable(),
  rank: z.enum(TAXON_RANKS_DESCENDING),
  sourceGbifId: z.number().nullable(),
  sourceInatId: z.number().nullable(),
  media: z.array(mediaItemSchema),
  notes: z.string(),
  names: z.array(nameItemFormSchema),
  states: groupedCharacterFormSchema,
  sources: setTaxonSourcesSchema,
});

const convertToServerCharacterValues = (
  values: TaxonEditFormValues["states"],
): CharacterByFeatureUpdate => {
  return values.map((feature) => ({
    featureId: feature.featureId,
    characters: feature.characters.map((v) => {
      switch (v.kind) {
        case "categorical":
          return {
            kind: "categorical",
            characterId: v.characterId,
            traitValues: v.traitValues.map((tv) => ({
              id: tv.id,
              modifierIds: tv.modifiers.map((m) => m.id),
            })),
          };

        case "number":
          return {
            kind: "number",
            characterId: v.characterId,
            unitId: v.unit?.id,
            siBaseValue: v.siBaseValue,
            modifierIds: v.modifiers.map((m) => m.id),
          };

        case "range":
          return {
            kind: "range",
            characterId: v.characterId,
            unitId: v.unit?.id,
            siBaseMin: v.siBaseMin,
            siBaseMax: v.siBaseMax,
            modifierIds: v.modifiers.map((m) => m.id),
          };
      }
    }),
  }));
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
  head: ({ loaderData, match }) =>
    routeSeo({
      title: loaderData
        ? `Editing ${loaderData.initialTaxon.acceptedName} | Klados`
        : "Klados",
      canonicalUrl: match.pathname,
    }),
  component: RouteComponent,
});

// TODO: Validation error displays
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
    defaultValues: seedTaxonEditState(
      initialTaxon,
      initialCharacterValues,
      initialSources,
    ),
  });
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = methods;

  console.log(errors);

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
      // For browsing lists, etc.
      qc.invalidateQueries({ queryKey: ["taxa"] }),
      // Invalidate all lookalike details involving this taxon
      qc.invalidateQueries({
        predicate: (q: Query) => {
          const key = q.queryKey;
          if (key[0] !== "lookalikeDetails") return false;

          const a = key[1];
          const b = key[2];

          return a === id || b === id;
        },
      }),
    ]);
  }

  const handleDiscard = () => {
    if (!isDirty) return;
    if (!confirm("Discard unsaved changes?")) return;
    reset(
      seedTaxonEditState(initialTaxon, initialCharacterValues, initialSources),
      {
        keepDirty: false,
      },
    );
  };

  const onSave: SubmitHandler<TaxonEditFormValues> = async (data) => {
    if (!isDirty) return;
    try {
      await serverUpdate({
        data: {
          ...data,
          id,
          states: convertToServerCharacterValues(data.states),
        },
      });
      reset(data, { keepDirty: false }); // keep RHF dirty tracking in sync
      await invalidateTaxon(id);
      toast({ description: "Taxon saved.", variant: "success" });
    } catch (error) {
      toast({
        description: getErrorMessage(error),
        variant: "error",
      });
    }
  };

  const onPublish: SubmitHandler<TaxonEditFormValues> = async (data) => {
    if (!isDraft) return;
    try {
      await serverUpdate({
        data: {
          ...data,
          id,
          states: convertToServerCharacterValues(data.states),
        },
      });
      reset(data, { keepDirty: false }); // clear dirty after persisting
      await serverPublish({ data: { id } });
      await invalidateTaxon(id);
      toast({ description: "Taxon published.", variant: "success" });
      navigate({ to: ".." });
    } catch (error) {
      toast({
        description: getErrorMessage(error),
        variant: "error",
      });
    }
  };

  const handleDelete: MouseEventHandler<HTMLButtonElement> = async (e) => {
    e.preventDefault();
    if (!isDraft || isDeleting || isSubmitting) return;

    const ok = window.confirm(
      "Delete this taxon draft? This cannot be undone.",
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
    } catch (error) {
      toast({
        description: getErrorMessage(error),
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ContentContainer align="start">
      <Text size="2">Editing details for:</Text>
      <Flex align="baseline" gap="2" mb="2">
        <Heading>{initialTaxon.acceptedName}</Heading>
        <Badge color={statusBadgeColor}>{initialTaxon.status}</Badge>
      </Flex>
      <Box>
        <RadixLink asChild size="2">
          <TanStackLink to="..">Back</TanStackLink>
        </RadixLink>
      </Box>

      <FormProvider {...methods}>
        <Form.Root onSubmit={handleSubmit(onSave)}>
          <Separator size="4" my="4" />
          {/* TODO: sync accepted name */}
          {/* Basic meta (rank, parent, source IDs) */}
          <MetaForm id={id} acceptedName={initialTaxon.acceptedName} />

          <Separator size="4" my="4" />

          {/* Characters */}
          <Controller
            name="states"
            control={control}
            render={({ field }) => (
              <CharacterEditingForm
                value={field.value as GroupedCharacterFormValue}
                onChange={field.onChange}
              />
            )}
          />

          <Separator size="4" my="4" />

          {/* Names */}
          <Controller
            control={control}
            name="names"
            render={({ field: { onChange } }) => (
              <NameEditingForm inatId={inatId} onChange={onChange} />
            )}
          />

          <Separator size="4" my="4" />

          {/* Media */}
          <MediaEditingForm inatId={inatId} />

          <Separator size="4" my="4" />

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

          {/* TODO: clean spacing + client discriminated rendering */}
          <Flex gap="2" justify="between" mt="5">
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
                type="button"
                variant={isDraft ? "soft" : "solid"}
                loading={isSubmitting || isDeleting}
                disabled={!isDirty || isSubmitting || isDeleting}
                onClick={handleSubmit(onSave)}
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
                    onClick={handleSubmit(onPublish)}
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
    </ContentContainer>
  );
}
