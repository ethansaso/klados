import "../../../../../assets/styles/pages/taxa/edit.css";

import { zodResolver } from "@hookform/resolvers/zod";
import { Badge, Box, Button, Flex, Heading, Separator } from "@radix-ui/themes";
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
import { PiArrowLeft } from "react-icons/pi";
import z from "zod";
import { TAXON_RANKS_DESCENDING } from "../../../../../../db/schema/schema";
import { ContentContainer } from "../../../../../components/ContentContainer";
import type { SourceDTO } from "../../../../../lib/domain/sources/types";
import type { CharacterByFeatureUpdate } from "../../../../../lib/domain/states/validation";
import { setTaxonSourcesSchema } from "../../../../../lib/domain/taxon-sources/validation";
import { getTaxonCharacterStatesFn } from "../../../../../lib/server-fns/character-states/getTaxonCharacterStatesFn";
import { deleteTaxonFn } from "../../../../../lib/server-fns/taxa/deleteTaxonFn";
import { getTaxonFn } from "../../../../../lib/server-fns/taxa/getTaxonFn";
import { publishTaxonFn } from "../../../../../lib/server-fns/taxa/publishFn";
import { updateTaxonFn } from "../../../../../lib/server-fns/taxa/updateTaxonFn";
import { getSourcesForTaxonFn } from "../../../../../lib/server-fns/taxon-sources/getSourcesForTaxonFn";
import { getErrorMessage } from "../../../../../lib/utils/getErrorMessage";
import { routeSeo } from "../../../../../lib/utils/head/routeSeo";
import { toast } from "../../../../../lib/utils/toast";
import { EditorActions } from "./-EditorActions";
import { CharacterEditingForm } from "./-characters/CharactersEditingForm";
import type { GroupedCharacterFormValue } from "./-characters/validation";
import { groupedCharacterFormSchema } from "./-characters/validation";
import { MediaEditingForm } from "./-media/MediaEditingForm";
import { mediaFormItemSchema } from "./-media/validation";
import { MetaForm } from "./-meta/MetaForm";
import { NameEditingForm } from "./-names/NameEditingForm";
import { nameItemFormSchema } from "./-names/validation";
import { seedTaxonEditState } from "./-seeding";
import { SourceEditingForm } from "./-sources/SourceEditingForm";
import { TextForm } from "./-text/TextForm";

export type TaxonEditFormValues = z.infer<typeof taxonEditFormSchema>;

export const taxonEditFormSchema = z.object({
  parentId: z.number().nullable(),
  rank: z.enum(TAXON_RANKS_DESCENDING),
  sourceGbifId: z.number().nullable(),
  sourceInatId: z.number().nullable(),
  media: z.array(mediaFormItemSchema),
  ecology: z.string(),
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
    notes: feature.notes,
    characters: feature.characters.map((v) => {
      switch (v.kind) {
        case "categorical":
          return {
            kind: "categorical",
            characterId: v.characterId,
            traitValueId: v.trait.id,
            modifierIds: v.modifiers.map((m) => m.id),
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
  const { control, handleSubmit, reset } = methods;

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
      methods.formState.isDirty && !(methods.formState.isSubmitting || isDeleting)
        ? !confirm("Leave without saving?")
        : false,
    enableBeforeUnload: () => methods.formState.isDirty,
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
      qc.invalidateQueries({ queryKey: ["taxon"] }),
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
    if (!methods.formState.isDirty) return;
    if (!confirm("Discard unsaved changes?")) return;
    reset(
      seedTaxonEditState(initialTaxon, initialCharacterValues, initialSources),
      {
        keepDirty: false,
      },
    );
  };

  const onSave: SubmitHandler<TaxonEditFormValues> = async (data) => {
    if (!methods.formState.isDirty) return;
    try {
      const { media, ...rest } = data;
      await serverUpdate({
        data: {
          ...rest,
          id,
          states: convertToServerCharacterValues(data.states),
          mediaIds: media.map((m) => m.id),
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
      const { media, ...rest } = data;
      await serverUpdate({
        data: {
          ...rest,
          id,
          states: convertToServerCharacterValues(data.states),
          mediaIds: media.map((m) => m.id),
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
    if (!isDraft || isDeleting || methods.formState.isSubmitting) return;

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
    <FormProvider {...methods}>
      <Flex
        className="taxon-editor"
        direction="column"
        height="100%"
        overflow="hidden"
      >
        <Flex
          align="center"
          justify="between"
          flexShrink="0"
          px="6"
          py="4"
          style={{
            background: "var(--color-background)",
            boxShadow: "inset 0 -1px 0 0 var(--gray-a5)",
          }}
        >
          <Flex align="center" gap="2">
            <Flex asChild align="center" gap="2">
              <Button asChild variant="ghost" size="2" mr="4">
                <TanStackLink to="..">
                  <PiArrowLeft /> Back
                </TanStackLink>
              </Button>
            </Flex>
            <Heading>{initialTaxon.acceptedName}</Heading>
            <Badge color={statusBadgeColor} size="2">
              {initialTaxon.status}
            </Badge>
          </Flex>

          <EditorActions
            isDraft={isDraft}
            isDeleting={isDeleting}
            onDiscard={handleDiscard}
            onSave={handleSubmit(onSave)}
            onPublish={handleSubmit(onPublish)}
            onDelete={handleDelete}
          />
        </Flex>
        <Flex
          flexGrow="1"
          flexShrink="1"
          minHeight="0"
          overflow="hidden"
          asChild
        >
          <Form.Root onSubmit={handleSubmit(onSave)} style={{ width: "100%" }}>
            <Box
              flexShrink="0"
              maxWidth="384px"
              p="5"
              overflow="auto"
              style={{
                background: "var(--color-background)",
                borderRight: "1px solid var(--gray-a5)",
              }}
            >
              {/* Basic meta (rank, parent, source IDs) */}
              <MetaForm id={id} acceptedName={initialTaxon.acceptedName} />

              <Separator size="4" my="5" />

              {/* Ecology/Notes */}
              <TextForm />

              <Separator size="4" my="5" />

              {/* Media */}
              <MediaEditingForm inatId={inatId} />

              <Separator size="4" my="5" />

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

              <Separator size="4" my="5" />

              {/* Names */}
              <Controller
                control={control}
                name="names"
                render={({ field: { onChange } }) => (
                  <NameEditingForm inatId={inatId} onChange={onChange} />
                )}
              />
            </Box>
            <ContentContainer align="start" gray>
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
            </ContentContainer>
          </Form.Root>
        </Flex>
      </Flex>
    </FormProvider>
  );
}
